# Makefile for Node.js, Docker, Fastify, and Drizzle project

# Variables
DOCKER_COMPOSE = docker-compose
NODE_ENV ?= development

# Phony targets
.PHONY: install start dev build test lint format clean docker-up docker-down db-migrate db-seed

# Install dependencies
install:
	yarn install

# Start the application in production mode
start:
	yarn start

# Start the application in development mode
dev:
	yarn dev

# Build the application
build:
	yarn build

# Run tests
test:
	yarn test

# Run linter
lint:
	yarn lint

# Format code
format:
	yarn format

# Clean build artifacts and dependencies
clean:
	rm -rf node_modules
	rm -rf dist
	yarn cache clean

# Start Docker containers
docker-up:
	$(DOCKER_COMPOSE) up -d

# Stop Docker containers
docker-down:
	$(DOCKER_COMPOSE) down

# Run database migrations
db-migrate:
	yarn drizzle-kit migrate

# Seed the database
db-seed:
	yarn drizzle-kit seed

# Generate database types
db-generate:
	yarn drizzle-kit generate

# Start the application with Docker
docker-start: docker-up
	yarn start

# Run all tests and linting
check: test lint

# Full cleanup and reinstall
reset: clean install

# Default target
all: install build