# Database Schema Definition

## 1. users
System-wide users (Admins & Estimators).
| Column | Type | Description |
| :--- | :--- | :--- |
| id | TEXT (PK) | Primary Key (UUID as string for auth compatibility) |
| phone_number | TEXT (Unique) | Primary identity (E.164 format) |
| name | TEXT | Full display name |
| role | TEXT | `admin` or `estimator` |
| status | TEXT | `pending`, `approved`, `suspended` |
| requested_at | TIMESTAMPTZ | Time of signup |
| approved_at | TIMESTAMPTZ | Time of admin approval |
| approved_by | TEXT | ID of the admin who approved |
| last_login_at | TIMESTAMPTZ | Last successful OTP |
| created_at | TIMESTAMPTZ | Record creation |

## 2. customers
Client database.
| Column | Type | Description |
| :--- | :--- | :--- |
| id | UUID (PK) | Unique ID |
| first_name | TEXT | Required |
| last_name | TEXT | Required |
| email | TEXT | Optional |
| phone | TEXT | Optional |
| address | TEXT | Street |
| city | TEXT | City |
| state | TEXT | State |
| zip_code | TEXT | Zip |
| type | TEXT | `homeowner`, `contractor`, etc. |
| status | TEXT | `active`, `prospect`, `archived` |
| notes | TEXT | Internal notes |
| tags | JSONB | Array of strings |
| created_by | TEXT (FK) | Reference to `users.id` |
| created_at | TIMESTAMPTZ | Record creation |

## 3. estimates
The core business document.
| Column | Type | Description |
| :--- | :--- | :--- |
| id | UUID (PK) | Unique ID |
| customer_id | UUID (FK) | Reference to `customers.id` |
| project_name | TEXT | Title (e.g., "Exterior Repaint") |
| project_type | TEXT | `interior`, `exterior`, `both` |
| status | TEXT | `draft`, `sent`, `approved`, `rejected` |
| labor_cost | NUMERIC | Calculated labor |
| material_cost | NUMERIC | Calculated materials |
| total_price | NUMERIC | Grand total |
| crew_size | INT | Number of painters |
| estimated_days | NUMERIC | Duration of job |
| hourly_rate | NUMERIC | Rate at time of creation |
| notes | TEXT | External notes for client |
| created_by | TEXT (FK) | Reference to `users.id` |
| created_at | TIMESTAMPTZ | Record creation |

## 4. estimate_items
Individual line items (rooms/areas).
| Column | Type | Description |
| :--- | :--- | :--- |
| id | UUID (PK) | Unique ID |
| estimate_id | UUID (FK) | Reference to `estimates.id` |
| area_name | TEXT | e.g., "Master Bedroom" |
| paint_product | TEXT | e.g., "SuperPaint" |
| color_name | TEXT | e.g., "Agreeable Gray" |
| gallons | NUMERIC | Quantity |
| coats | INT | default 2 |
| price_per_gallon | NUMERIC | Cost at time of creation |

## 5. estimate_shares
Peer-to-peer sharing.
| Column | Type | Description |
| :--- | :--- | :--- |
| id | UUID (PK) | Unique ID |
| estimate_id | UUID (FK) | Reference to `estimates.id` |
| shared_with | TEXT (FK) | Reference to `users.id` |
| permission | TEXT | `view` or `edit` |
| created_at | TIMESTAMPTZ | Share time |
