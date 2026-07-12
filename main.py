from fastapi import FastAPI

app = FastAPI(title="Dropshipping Backoffice API")

@app.get("/")
def read_root():
    return {"message": "Welcome to Dropshipping Backoffice API"}
