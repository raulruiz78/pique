-- flushPendingPush (cron diario y el flush inmediato tras cada acción) lee y
-- actualiza estas dos tablas con el cliente service_role, pero nunca se les
-- concedió acceso: cada consulta fallaba con "permission denied" y el envío
-- de push quedaba en silencio devolviendo siempre 0 enviados.
grant select, update on table public.notifications to service_role;
grant select, delete on table public.devices to service_role;
