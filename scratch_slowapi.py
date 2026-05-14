from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.testclient import TestClient

limiter = Limiter(key_func=get_remote_address, default_limits=["2/minute"])
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.get("/test")
def test_route(request: Request):
    return {"status": "ok"}

client = TestClient(app)
print("1", client.get("/test").status_code)
print("2", client.get("/test").status_code)
print("3", client.get("/test").status_code)
