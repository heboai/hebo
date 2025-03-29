# Hebo Backend

Django-based backend service with integrated frontend tooling.

## Development Setup

### Prerequisites

- Python 3.13+
- uv 0.5.8+
- Node.js 18+
- npm 9+
- PostgreSQL 17+ with pgvector extension

### Environment Setup

1. Create and activate a virtual environment:
```bash
uv sync
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DEBUG=True
SECRET_KEY=your-secret-key
POSTGRES_DB=hebo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Development Workflow

1. Start the PostgreSQL database:
```bash
docker compose up db
```

2. Apply database migrations:
```bash
uv run python manage.py migrate
```

3. Start the development servers:

Terminal 1 - Django server:
```bash
uv run python manage.py runserver
```

Terminal 2 - Frontend asset compilation:
```bash
npm run dev
```

The application will be available at:
- Django: http://localhost

### Frontend Development

The project uses:
- Tailwind CSS for styling
- DaisyUI for UI components
- Alpine.js for JavaScript interactivity
- HTMX for dynamic HTML updates

Frontend source files are located in:
- `static/src/css/` - CSS files
- `static/src/js/` - JavaScript files
- `templates/` - HTML templates

When you make changes to these files:
- CSS/JS changes will automatically recompile
- Template changes will be reflected upon browser refresh

### Building for Production

1. Compile frontend assets:
```bash
npm run build
```

2. Collect static files:
```bash
uv run python manage.py collectstatic
```

### Project Structure

```
backend/
├── static/                 # Frontend assets
│   ├── src/               # Source files
│   │   ├── css/          # CSS source files
│   │   └── js/           # JavaScript source files
│   └── dist/             # Compiled assets
├── templates/             # Django templates
├── core/                  # Core Django app
├── knowledge/            # Knowledge base app
├── threads/             # Threads app
└── manage.py            # Django management script
```

### Available Commands

#### Django Commands
- `python manage.py runserver` - Start development server
- `python manage.py migrate` - Apply database migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py collectstatic` - Collect static files

#### npm Commands
- `npm run dev` - Start frontend development mode
- `npm run build` - Build frontend assets for production
- `npm run watch:css` - Watch and compile CSS only
- `npm run watch:js` - Watch and compile JavaScript only

### Testing

Run Django tests:
```bash
uv run python manage.py test
```

### Code Quality

1. Format Python code:
```bash
uv run ruff format
```

2. Run Python linter:
```bash
uv run ruff check
```

### Troubleshooting

1. **Static files not updating?**
   - Clear your browser cache
   - Ensure `npm run dev` is running
   - Check for compilation errors in the terminal

2. **Database connection issues?**
   - Verify PostgreSQL is running: `docker compose ps`
   - Check database credentials in `.env`
   - Ensure pgvector extension is installed

3. **Template changes not reflecting?**
   - Check `DEBUG=True` in settings
   - Hard refresh browser (Ctrl+F5)
   - Restart Django development server