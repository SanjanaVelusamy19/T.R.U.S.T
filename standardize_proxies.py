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

template = """async def _proxy_to_{name}_service(request: Request, downstream_path: str) -> Response:
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
            "params": request.query_params,
        }}
        if body is not None:
            kwargs["json"] = body
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(**kwargs)
            logger.info("Proxy SUCCESS downstream_url=%s status=%s", url, resp.status_code)
            
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            media_type=resp.headers.get("content-type", "application/json"),
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

    # Ensure HTTPException is imported
    if "HTTPException" not in content:
        content = content.replace("from fastapi import APIRouter", "from fastapi import APIRouter, HTTPException")

    new_func = template.format(name=name, setting=setting)

    if name == "loan":
        # loan_routes.py has it inline, so we rewrite it completely
        # It currently has:
        # @router.api_route("/check-loan", methods=["POST"])
        # @limiter.limit(settings.rate_limit_default)
        # async def proxy_check_loan(
        #     request: Request,
        #     _claims: dict = Depends(require_jwt),
        # ) -> Response:
        #     """Forward loan eligibility check; requires valid JWT (verified by dependency)."""
        #     url = f"{settings.loan_service_url.rstrip('/')}/check-loan"
        #     ... all the way to end of file
        
        # We can just replace the whole proxy_check_loan body
        match = re.search(r'(@router\.api_route\("/check-loan", methods=\["POST"\]\)\s*@limiter\.limit\(settings\.rate_limit_default\)\s*async def proxy_check_loan\([\s\S]*?\)\s*-> Response:\s*)[\s\S]*', content)
        if match:
            new_content = content[:match.start()] + new_func + "\n\n\n" + match.group(1) + f'    return await _proxy_to_loan_service(request, "/check-loan")\n'
            content = new_content
    else:
        # For others, we replace _proxy_to_X_service all the way up to the first @router endpoint
        # usually ends just before @router...
        match = re.search(f'async def _proxy_to_{name}_service\\(request: Request, downstream_path: str\\) -> Response:[\\s\\S]*?(?=\n\n\n@router)', content)
        if match:
            content = content[:match.start()] + new_func + content[match.end():]
        else:
            # Maybe it uses 2 newlines instead of 3
            match = re.search(f'async def _proxy_to_{name}_service\\(request: Request, downstream_path: str\\) -> Response:[\\s\\S]*?(?=\n\n@router)', content)
            if match:
                content = content[:match.start()] + new_func + content[match.end():]

    with open(rf, "w") as f:
        f.write(content)
    print(f"Standardized: {rf}")
