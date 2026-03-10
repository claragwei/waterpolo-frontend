#!/bin/bash
set -e

echo "🏊 UC Davis Water Polo API - Quick Start"
echo "========================================"

PYTHON_BIN=python3.12

# Check Python 3.12
if ! command -v $PYTHON_BIN &> /dev/null; then
    echo "❌ Python 3.12 is not installed."
    echo "Install it with:"
    echo "brew install python@3.12"
    exit 1
fi

echo "✅ Using $($PYTHON_BIN --version)"

# Create venv if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    $PYTHON_BIN -m venv venv
fi

# Activate venv
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip inside venv
echo "⬆️ Updating pip..."
python -m pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
python -m pip install -r requirements.txt

# Setup env file
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    echo "⚠️ Update DATABASE_URL in .env before continuing"
    read -p "Press Enter after updating .env..."
fi

# Initialize database
echo "🗄️ Creating database tables..."
python models.py

echo "🚀 Starting API server..."
echo "API: http://localhost:8000"
echo "Docs: http://localhost:8000/docs"

python main.py