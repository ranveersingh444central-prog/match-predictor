"""
PITCHIQ FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router as api_router
from app.api.ufc_endpoints import router as ufc_router

app = FastAPI(
    title="PITCHIQ Multi-Sport Intelligence Platform",
    version=settings.app_version,
    description="Multi-Sport Match Outcome Prediction & Analytics Platform (Football + UFC/MMA)"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Football API routes under /api
app.include_router(api_router, prefix="/api", tags=["Football Intelligence"])

# Include UFC API routes under /api/ufc
app.include_router(ufc_router, prefix="/api/ufc", tags=["UFC / MMA Intelligence"])

@app.get("/")
def root():
    return {
        "message": "PITCHIQ Football Match Prediction API",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
