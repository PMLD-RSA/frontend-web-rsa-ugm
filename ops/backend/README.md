# Backend data needed for the Vokasi dashboard

The authenticated `GET /api/tanks` currently fails on the university backend with PostgreSQL `42703: column "min_distance_cm" does not exist`. The backend source selects every column in `tanks`, including `min_distance_cm`, `max_distance_cm`, `latitude`, and `longitude`.

1. On the server, confirm the deployed backend version and the database selected by its `DATABASE_URL`. Inspect the live `tanks` schema and make a database backup.
2. Apply [`20261119_add_tank_columns.sql`](./20261119_add_tank_columns.sql) to that database, or review and run the backend's documented `npm run db:push` with the same database URL. The SQL is limited to the four tank columns used by the current backend schema.
3. In a browser session that is already logged in, check `http://localhost:3000/api/tanks`. It must return `success: true` with an array in `data`, even if that array is empty. If it fails on a different column, compare the entire live schema with `src/db/schema/` in the deployed backend.
4. Register the actual DTEDI, DTK, and DLIKES tanks, their capacities and ultrasonic calibration distances, thresholds, and each sensor's real `device_code`/gateway association in the backend database. The frontend map coordinates alone do not create database records. Use the backend's tank API or deployment process for these records. The coordinates are:

   | Tank | Latitude | Longitude |
   | --- | ---: | ---: |
   | DTEDI | -7.7751167 | 110.3736611 |
   | DTK | -7.7747806 | 110.3743778 |
   | DLIKES | -7.7738361 | 110.3744028 |

5. Check that the MQTT worker receives level messages for those registered sensor codes, writes readings, and sends `LEVEL_UPDATE` over `/ws`. A reading outside alert thresholds should create an alert via the warning engine; only then will `/api/alerts` have rows and the Alarm and Events screen show them. The frontend already connects to the configured backend WebSocket and polls alerts every five seconds.

Do not run `npm run init-db` on the live Vokasi database: the checked-in seed script inserts or updates RSA example tanks and overwrites the `admin` account password with a fixed sample value. The checked-in simulator also uses RSA example node codes and is unsuitable as a live data source for Vokasi.

Before testing sensor messages addressed by `device_code`, apply [`0001-fix-sensor-code-lookup.patch`](./0001-fix-sensor-code-lookup.patch) in a checkout of the backend repository (`git apply /path/to/0001-fix-sensor-code-lookup.patch`), then build and deploy that backend. `TankCalculatorService.getTankConfigForNode()` currently compares the code to a UUID column and a text column in the same SQL `OR`. PostgreSQL can reject a non-UUID device code during the UUID comparison. The patch selects the UUID branch only when the identifier is a UUID; otherwise it selects by `sensor_nodes.device_code`.
