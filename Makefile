.PHONY: up down migrate

up:
	docker compose up --build

down:
	docker compose down

ps:
	docker compose ps

migrate:
	docker compose exec api npm run migrate
