-- Rename constraint names left over from the customer -> buyer table/column
-- rename in 20260707072658_rename_customer_to_buyer.sql, so constraint
-- names match the renamed tables/columns.

ALTER TABLE public.buyer_team_members RENAME CONSTRAINT customer_team_members_customer_id_fkey TO buyer_team_members_buyer_id_fkey;
ALTER TABLE public.buyer_team_members RENAME CONSTRAINT customer_team_members_pkey TO buyer_team_members_pkey;
ALTER TABLE public.buyer_team_members RENAME CONSTRAINT customer_team_members_customer_id_email_key TO buyer_team_members_buyer_id_email_key;
ALTER TABLE public.buyers RENAME CONSTRAINT customers_pkey TO buyers_pkey;
ALTER TABLE public.buyers RENAME CONSTRAINT customers_id_fkey TO buyers_id_fkey;
ALTER TABLE public.contracts RENAME CONSTRAINT contracts_customer_id_fkey TO contracts_buyer_id_fkey;
ALTER TABLE public.enquiries RENAME CONSTRAINT enquiries_customer_id_fkey TO enquiries_buyer_id_fkey;
ALTER TABLE public.jobs RENAME CONSTRAINT jobs_customer_id_fkey TO jobs_buyer_id_fkey;
ALTER TABLE public.payment_methods RENAME CONSTRAINT payment_methods_customer_id_fkey TO payment_methods_buyer_id_fkey;
ALTER TABLE public.projects RENAME CONSTRAINT projects_customer_id_fkey TO projects_buyer_id_fkey;
ALTER TABLE public.proposals RENAME CONSTRAINT proposals_customer_id_fkey TO proposals_buyer_id_fkey;
ALTER TABLE public.reviews RENAME CONSTRAINT reviews_customer_id_fkey TO reviews_buyer_id_fkey;
ALTER TABLE public.saved_vendors RENAME CONSTRAINT saved_vendors_customer_id_fkey TO saved_vendors_buyer_id_fkey;
ALTER TABLE public.saved_vendors RENAME CONSTRAINT saved_vendors_customer_id_vendor_id_contractor_id_key TO saved_vendors_buyer_id_vendor_id_contractor_id_key;
