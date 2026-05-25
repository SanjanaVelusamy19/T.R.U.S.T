import os
import glob
import re

base_dir = r"C:\Users\Sanjana\T.R.U.S.T"

route_files = glob.glob(os.path.join(base_dir, "gateway", "routes", "*_routes.py"))
for rf in route_files:
    with open(rf, "r") as f:
        content = f.read()
    
    # Remove the wrongly placed logger.info
    content = re.sub(
        r'\s*logger\.info\("Proxy SUCCESS downstream_url=%s status=%s", url, resp\.status_code\)',
        r'',
        content
    )
    
    # Insert it correctly after `resp = await client.request(...)`
    # We will match `resp = await client.request(...)` and inject it on the next line.
    
    # It usually ends with `params=request.query_params,\n            )`
    # or `headers=headers,\n            )`
    # or `**kwargs)`
    
    content = re.sub(
        r'(resp = await client\.request\([^)]*\)\n)',
        r'\1            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)\n',
        content
    )

    # For kwargs:
    content = re.sub(
        r'(resp = await client\.request\(\*\*kwargs\)\n)',
        r'\1            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)\n',
        content
    )
    
    with open(rf, "w") as f:
        f.write(content)
    print(f"Fixed logging in: {rf}")
