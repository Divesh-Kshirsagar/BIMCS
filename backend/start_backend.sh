#!/bin/bash
export CUDA_VISIBLE_DEVICES="-1"
echo "Starting Boiler Digital Twin Backend (CPU Mode)..."
./.venv/bin/python -m uvicorn main:app --reload