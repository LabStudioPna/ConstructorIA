-- ConstructorIA PostgreSQL Schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE budget_items (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  description VARCHAR(255),
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  total DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  metric VARCHAR(100),
  predicted_value DECIMAL(12, 2),
  confidence DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_items_project ON budget_items(project_id);
