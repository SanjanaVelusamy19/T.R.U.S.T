import os
import glob
import re

base_dir = r"C:\Users\Sanjana\T.R.U.S.T"

# 1. Fix Dockerfiles
dockerfiles = glob.glob(os.path.join(base_dir, "*", "Dockerfile"))
for df in dockerfiles:
    with open(df, "r") as f:
        content = f.read()
    
    # Replace CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "800X"]
    # with CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-800X}"
    new_content = re.sub(
        r'CMD \["uvicorn", "main:app", "--host", "0\.0\.0\.0", "--port", "(\d+)"\]',
        r'CMD sh -c "uvicorn main:app --host 0.0.0.0 --port $${PORT:-\1}"',
        content
    )
    
    if content != new_content:
        with open(df, "w") as f:
            f.write(new_content)
        print(f"Updated Dockerfile: {df}")

# 2. Add logging to proxy route files
route_files = glob.glob(os.path.join(base_dir, "gateway", "routes", "*_routes.py"))
for rf in route_files:
    with open(rf, "r") as f:
        content = f.read()
    
    # Add logging import if not present
    if "import logging" not in content:
        content = "import logging\n" + content
    
    # Ensure logger is defined
    service_name = os.path.basename(rf).replace("_routes.py", "")
    if f'logger = logging.getLogger(' not in content:
        # insert after imports
        content = re.sub(r'(import .*?\n\n)', rf'\1logger = logging.getLogger("trust.gateway.{service_name}")\n\n', content, count=1)
    
    # Add logger.info and logger.error to httpx block
    # We already have:
    # async with httpx.AsyncClient(timeout=30.0) as client:
    #     resp = await client.request(
    #         request.method,
    #         url,
    #         content=body if body else None,
    #         headers=headers,
    #         params=request.query_params,
    #     )
    
    # Let's replace the except block to include logging
    content = re.sub(
        r'    except httpx\.RequestError as exc:\n        raise HTTPException\(\n            status_code=status\.HTTP_503_SERVICE_UNAVAILABLE,\n            detail=f".*?: \{str\(exc\)\}",\n        \)',
        r'    except httpx.RequestError as exc:\n        logger.error("Proxy FAILURE downstream_url=%s error=%s", url, str(exc))\n        raise HTTPException(\n            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,\n            detail=f"Downstream service unavailable: {str(exc)}",\n        )',
        content
    )
    
    # Add success log after await client.request
    if 'logger.info("Proxy SUCCESS' not in content:
        content = re.sub(
            r'(resp = await client\.request\([\s\S]*?\))(\n\s*except)',
            r'\1\n            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)\2',
            content
        )
        
        # for auth_routes.py which uses kwargs
        content = re.sub(
            r'(resp = await client\.request\(\*\*kwargs\))(\n\s*# IMPORTANT)',
            r'\1\n            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)\2',
            content
        )

    with open(rf, "w") as f:
        f.write(content)
    print(f"Updated logging in: {rf}")

print("All updates applied.")
