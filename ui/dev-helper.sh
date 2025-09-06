#!/bin/bash

# HappySoup UI Development Helper Script
# This script helps manage Vite development servers and port conflicts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill processes on Vite ports
kill_vite_ports() {
    print_status "Checking for processes on Vite ports (5173-5176)..."
    
    for port in 5173 5174 5175 5176; do
        PID=$(lsof -ti:$port 2>/dev/null || echo "")
        if [ ! -z "$PID" ]; then
            print_warning "Killing process $PID on port $port"
            kill -9 $PID 2>/dev/null || true
        fi
    done
    
    print_success "All Vite ports cleared"
}

# Function to check Docker containers
check_docker() {
    print_status "Checking Docker containers..."
    
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Docker containers are not running!"
        print_status "Starting Docker containers..."
        docker-compose up -d
    else
        print_success "Docker containers are running"
    fi
}

# Function to start UI development server
start_ui() {
    print_status "Starting UI development server on port 5173..."
    
    # Kill any existing processes
    kill_vite_ports
    
    # Start the development server
    npm run start
}

# Function to show port status
show_ports() {
    print_status "Current port usage:"
    echo ""
    echo "Port 3000 (Backend API):"
    lsof -i :3000 2>/dev/null | head -2 || echo "  Not in use"
    echo ""
    echo "Port 5173 (New UI):"
    lsof -i :5173 2>/dev/null | head -2 || echo "  Not in use"
    echo ""
    echo "Ports 5174-5176 (Should be free):"
    for port in 5174 5175 5176; do
        PROCESS=$(lsof -i :$port 2>/dev/null | tail -n +2 | head -1 || echo "")
        if [ ! -z "$PROCESS" ]; then
            echo "  Port $port: $PROCESS"
        else
            echo "  Port $port: Free"
        fi
    done
}

# Function to show help
show_help() {
    echo "HappySoup UI Development Helper"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Kill existing Vite processes and start UI on port 5173"
    echo "  kill        Kill all processes on Vite ports (5173-5176)"
    echo "  ports       Show current port usage"
    echo "  docker      Check and start Docker containers if needed"
    echo "  status      Show overall development environment status"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Clean start of UI development server"
    echo "  $0 kill     # Kill all Vite processes"
    echo "  $0 status   # Check environment status"
}

# Function to show overall status
show_status() {
    echo "=== HappySoup Development Environment Status ==="
    echo ""
    
    check_docker
    echo ""
    show_ports
    echo ""
    
    # Check if CORS is properly configured
    if docker-compose exec -T webapp env | grep -q "CORS_DOMAINS.*5173"; then
        print_success "CORS is configured for port 5173"
    else
        print_warning "CORS might not be configured for port 5173"
    fi
}

# Main script logic
case "${1:-help}" in
    "start")
        start_ui
        ;;
    "kill")
        kill_vite_ports
        ;;
    "ports")
        show_ports
        ;;
    "docker")
        check_docker
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        show_help
        ;;
esac
