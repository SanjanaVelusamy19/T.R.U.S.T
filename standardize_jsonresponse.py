import os
import glob
import re

base_dir = r"C:\Users\Sanjana\T.R.U.S.T"

services = {
    "fraud": "fraud_detection_service_url",
    "monitoring": "monitoring_service_url",
    "trust": "trust_score_service_url",
    "advisor": "advisor_service_url",
    "twin": "digital_twin_service_url",
    "gold_loan": "gold_loan_service_url",
    "loan": "loan_service_url",
}

template = """async def _proxy_to_{name}_service(request: Request, downstream_path: str) -> JSONResponse:
    base = settings.{setting}.rstrip("/")
    url = f"{{base}}{{downstream_path}}"
    
    try:
        body = await request.json()
    except Exception:
        body = None
        
    headers = {{}}
    auth_header = request.headers.get("authorization")
    if auth_header:
        headers["authorization"] = auth_header
        
    try:
        kwargs = {{
            "method": request.method,
            "url": url,
            "headers": headers,
            "params": dict(request.query_params),
        }}
        if body is not None:
            kwargs["json"] = body
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(**kwargs)
            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)
            
        try:
            data = resp.json()
        except ValueError:
            # Fallback if downstream didn't return valid JSON
            data = {{"detail": "Non-JSON response from downstream", "raw": resp.text[:200]}}

        return JSONResponse(
            content=data,
            status_code=resp.status_code,
            headers={{
                k: v for k, v in resp.headers.items()
                if k.lower() not in {{"content-length", "content-encoding", "transfer-encoding", "content-type"}}
            }}
        )
    except httpx.RequestError as exc:
        logger.error("Proxy FAILURE downstream_url=%s error=%s", url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Downstream service unavailable: {{str(exc)}}",
        )"""

for name, setting in services.items():
    rf = os.path.join(base_dir, "gateway", "routes", f"{name}_routes.py")
    if not os.path.exists(rf):
        continue
        
    with open(rf, "r") as f:
        content = f.read()

    # Ensure JSONResponse is imported
    if "from fastapi.responses import JSONResponse" not in content:
        content = content.replace("from fastapi import APIRouter", "from fastapi import APIRouter\nfrom fastapi.responses import JSONResponse")

    new_func = template.format(name=name, setting=setting)

    match = re.search(f'async def _proxy_to_{name}_service\\(request: Request, downstream_path: str\\) -> Response:[\\s\\S]*?(?=\n\n\n@router)', content)
    if match:
        content = content[:match.start()] + new_func + content[match.end():]
    else:
        match = re.search(f'async def _proxy_to_{name}_service\\(request: Request, downstream_path: str\\) -> Response:[\\s\\S]*?(?=\n\n@router)', content)
        if match:
            content = content[:match.start()] + new_func + content[match.end():]
        else:
            print(f"Could not find _proxy_to_{name}_service in {rf}")

    # Fix the return types of the routes to JSONResponse
    content = re.sub(r'-> Response:', r'-> JSONResponse:', content)

    with open(rf, "w") as f:
        f.write(content)
    print(f"Standardized JSONResponse: {rf}")
