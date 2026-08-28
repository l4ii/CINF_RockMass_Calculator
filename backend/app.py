"""CINF矿山岩体质量分级软件本地后端：智能助手 API（嵌入式 GGUF），端口 5000。"""
from __future__ import annotations

import os
import sys

from win_llama_runtime_env import apply_if_windows

apply_if_windows()

_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from flask import Flask, jsonify
from flask_cors import CORS

from assistant_api import register_assistant_routes

app = Flask(__name__)


def _allowed_cors_origins():
    raw = os.environ.get("CINF_ALLOWED_ORIGINS")
    if raw:
        return [x.strip() for x in raw.split(",") if x.strip()]
    return ["null", "http://localhost:5173", "http://127.0.0.1:5173"]


ALLOWED_CORS_ORIGINS = _allowed_cors_origins()

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ALLOWED_CORS_ORIGINS,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)

register_assistant_routes(app)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "app": "cinf-met-assistant"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
