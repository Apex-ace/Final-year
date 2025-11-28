from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, skills, search, chats, reviews, swaps, extras # Ensure skills is imported

app = FastAPI(title="SkillSwap Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TEMPORARY DEBUG: ALLOW ALL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(skills.router, prefix="/skills", tags=["skills"]) 
app.include_router(chats.router, prefix="/chats", tags=["chats"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
app.include_router(extras.router, prefix="/extras", tags=["extras"])
app.include_router(swaps.router, prefix="/swaps", tags=["Swaps"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(work.router, prefix="/work", tags=["Work"])

@app.get("/")
def root():
    return {"ok": True, "message": "SkillSwap backend running"}