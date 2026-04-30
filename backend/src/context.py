import contextvars

# Contexto para almacenar el user_id de la petición actual
current_user_id_var = contextvars.ContextVar("current_user_id", default=None)
