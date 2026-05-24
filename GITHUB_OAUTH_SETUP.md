# GitHub OAuth Setup Guide

## Frontend Implementation ✅ COMPLETE

The frontend has been updated with GitHub OAuth support:

- **New Endpoints**: 
  - `POST /v1/auth/github/authorize` - Returns GitHub authorization URL
  - `POST /v1/auth/github/callback` - Exchanges code for JWT token

- **New Components**:
  - `GithubCallback.tsx` - Callback handler after GitHub redirect
  - Updated `Login.tsx` - Added GitHub button
  - Updated `AuthContext.tsx` - Added `loginWithGithub()` and `loginWithGithubCode()`

- **Login Flow**:
  1. User clicks "🔗 Entrar con GitHub"
  2. Frontend calls `GET /v1/auth/github/authorize`
  3. Backend returns GitHub authorization URL
  4. Frontend redirects to GitHub login
  5. GitHub redirects to callback URL with `code` parameter
  6. Frontend exchanges code for JWT token
  7. User authenticated and navigated to VOLTA_HOME

---

## Backend Implementation REQUIRED

### Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill form:
   - **Application name**: Holy Oly
   - **Homepage URL**: `https://holy-oly-app.web.app` (or your frontend URL)
   - **Authorization callback URL**: `https://holy-oly-app.web.app/#/github_callback`
4. Save **Client ID** and **Client Secret**

### Step 2: Environment Variables

Add to backend `.env`:

```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://holy-oly-app.web.app/#/github_callback
```

### Step 3: Backend Endpoints

#### `GET /v1/auth/github/authorize`

Returns GitHub authorization URL for frontend redirect.

```python
@router.get("/github/authorize")
async def github_authorize():
    state = secrets.token_urlsafe(32)
    # Store state in Redis cache for validation (expires in 10min)
    await redis.setex(f"oauth:state:{state}", 600, "valid")
    
    authorize_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_CALLBACK_URL}"
        f"&scope=user:email"
        f"&state={state}"
    )
    return {"authorize_url": authorize_url}
```

#### `POST /v1/auth/github/callback`

Exchanges GitHub code for JWT token.

```python
@router.post("/github/callback")
async def github_callback(body: dict):
    code = body.get("code")
    state = body.get("state")
    
    # 1. Validate state (CSRF protection)
    if not state or not await redis.exists(f"oauth:state:{state}"):
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # 2. Exchange code for token
    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        json={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        },
        headers={"Accept": "application/json"},
    )
    github_token = token_response.json().get("access_token")
    
    # 3. Fetch GitHub user info
    user_response = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {github_token}"},
    )
    github_user = user_response.json()
    
    # 4. Find or create user in AlloyDB
    user = db.query(User).filter(
        User.email == github_user["email"]
    ).first()
    
    if not user:
        user = User(
            email=github_user["email"],
            name=github_user["name"],
            github_id=github_user["id"],
            role="athlete",
            product="volta",  # Default to Volta
            subscription="free",
        )
        db.add(user)
        db.commit()
    else:
        # Update GitHub ID if not already set
        if not user.github_id:
            user.github_id = github_user["id"]
            db.commit()
    
    # 5. Generate JWT token
    access_token = create_access_token({"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "product": user.product,
        }
    }
```

### Step 4: Database Schema Update

Add GitHub OAuth fields to User model:

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String, nullable=True)  # Nullable for GitHub users
    github_id = Column(String, nullable=True)  # GitHub user ID
    role = Column(String, default="athlete")
    product = Column(String, default="volta")
    subscription = Column(String, default="free")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Step 5: Migration Script

```sql
ALTER TABLE users ADD COLUMN github_id VARCHAR(255);
ALTER TABLE users ADD UNIQUE(github_id);
ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;
```

### Step 6: Dependencies

```bash
pip install PyGithub python-jose python-multipart
```

### Step 7: Testing

Test the flow locally:

```bash
# 1. Start backend
python -m uvicorn main:app --reload

# 2. Get authorize URL
curl http://localhost:8000/v1/auth/github/authorize

# 3. Visit returned URL, authorize, get code from callback

# 4. Exchange code
curl -X POST http://localhost:8000/v1/auth/github/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "your_github_code"}'
```

---

## Integration with Existing Auth

Both methods now work:
- Email/Password login (via `/v1/auth/login`)
- GitHub OAuth (via `/v1/auth/github/callback`)

Same JWT token format, same user model, same authorization checks.

---

## Production Checklist

- [ ] GitHub OAuth app created with correct callback URL
- [ ] Environment variables set in production
- [ ] HTTPS enforced for all OAuth endpoints
- [ ] State validation working (Redis)
- [ ] User creation/update logic tested
- [ ] JWT token generation tested
- [ ] AlloyDB migration applied
- [ ] Frontend callback URL matches GitHub OAuth app settings
- [ ] Error handling for network failures
- [ ] Rate limiting on OAuth endpoints
