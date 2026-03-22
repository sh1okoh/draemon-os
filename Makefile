.PHONY: up down migrate episodes

up:
	docker compose up --build -d

down:
	docker compose down

ps:
	docker compose ps

migrate:
	docker compose exec api npm run migrate

episodes:
	docker compose exec postgres psql -U memory -d memory -c "SELECT id, project, summary, source, created_at FROM episodes ORDER BY created_at DESC;"
