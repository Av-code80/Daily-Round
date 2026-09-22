-- Security Advisor: "Function Search Path Mutable" on these two functions.
-- Neither pinned `search_path`, unlike create_invoice_draft/update_invoice_draft
-- which already `set search_path = public`. A mutable search_path lets a
-- caller who can create objects earlier in the path shadow an unqualified
-- reference inside the function body. Pinning it closes that off.
alter function public.guard_finalised_invoice() set search_path = public;
alter function public.handle_new_next_auth_user() set search_path = public;
