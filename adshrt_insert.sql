--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

-- Started on 2026-01-18 00:50:11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 75708)
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id character varying(36) NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 75719)
-- Name: banned_ips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banned_ips (
    id character varying(36) NOT NULL,
    ip text NOT NULL,
    reason text,
    banned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.banned_ips OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 75729)
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blog_posts (
    id character varying(36) NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image text,
    is_published boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.blog_posts OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 75741)
-- Name: clicks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clicks (
    id character varying(36) NOT NULL,
    link_id character varying(36) NOT NULL,
    country text,
    device text,
    browser text,
    referrer text,
    clicked_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clicks OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 75749)
-- Name: custom_ads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_ads (
    id character varying(36) NOT NULL,
    name text NOT NULL,
    ad_code text NOT NULL,
    placement text NOT NULL,
    device_type text NOT NULL,
    ad_size text NOT NULL,
    is_enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.custom_ads OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 75758)
-- Name: earning_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.earning_settings (
    id character varying(36) NOT NULL,
    key text NOT NULL,
    value text
);


ALTER TABLE public.earning_settings OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 75767)
-- Name: links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.links (
    id character varying(36) NOT NULL,
    original_url text NOT NULL,
    short_code character varying(20) NOT NULL,
    user_id character varying(36),
    creator_ip text,
    is_disabled boolean DEFAULT false,
    is_banned boolean DEFAULT false,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.links OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 75779)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id character varying(36) NOT NULL,
    user_id character varying(36),
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text,
    is_read boolean DEFAULT false,
    is_global boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 75790)
-- Name: offerwall_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offerwall_completions (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    network text NOT NULL,
    offer_id text NOT NULL,
    transaction_id text,
    payout text NOT NULL,
    ip text,
    completed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offerwall_completions OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 75798)
-- Name: offerwall_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offerwall_settings (
    id character varying(36) NOT NULL,
    network text NOT NULL,
    is_enabled boolean DEFAULT true,
    api_key text,
    secret_key text,
    user_id text,
    postback_url text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.offerwall_settings OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 75809)
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rate_limits (
    id character varying(36) NOT NULL,
    ip text NOT NULL,
    month text NOT NULL,
    count integer DEFAULT 0
);


ALTER TABLE public.rate_limits OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 75817)
-- Name: referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referrals (
    id character varying(36) NOT NULL,
    referrer_id character varying(36) NOT NULL,
    referred_id character varying(36) NOT NULL,
    referral_code text NOT NULL,
    status text DEFAULT 'pending'::text,
    links_created integer DEFAULT 0,
    social_proof text,
    ip text,
    created_at timestamp without time zone DEFAULT now(),
    validated_at timestamp without time zone
);


ALTER TABLE public.referrals OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 75827)
-- Name: site_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_settings (
    id character varying(36) NOT NULL,
    key text NOT NULL,
    value text
);


ALTER TABLE public.site_settings OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 75836)
-- Name: social_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_verifications (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    screenshot_links text NOT NULL,
    status text DEFAULT 'pending'::text,
    admin_notes text,
    submitted_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone
);


ALTER TABLE public.social_verifications OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 75847)
-- Name: sponsored_post_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sponsored_post_reactions (
    id character varying(36) NOT NULL,
    post_id character varying(36) NOT NULL,
    visitor_id text NOT NULL,
    reaction text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sponsored_post_reactions OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 75855)
-- Name: sponsored_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sponsored_posts (
    id character varying(36) NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    content text,
    logo_url text,
    banner_url text,
    website_url text,
    social_links text,
    is_active boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    priority integer DEFAULT 0,
    view_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    likes integer DEFAULT 0,
    dislikes integer DEFAULT 0,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sponsored_posts OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 75870)
-- Name: task_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_submissions (
    id character varying(36) NOT NULL,
    task_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    proof_data text NOT NULL,
    proof_url text,
    proof_text text,
    screenshot_links text,
    status text DEFAULT 'pending'::text,
    admin_notes text,
    submitted_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone
);


ALTER TABLE public.task_submissions OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 75879)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id character varying(36) NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    instructions text,
    requirements text,
    proof_instructions text,
    reward_usd text NOT NULL,
    proof_type text NOT NULL,
    is_active boolean DEFAULT true,
    max_completions integer,
    completed_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 75889)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    type text NOT NULL,
    amount text NOT NULL,
    description text,
    network text,
    offer_id text,
    ip text,
    status text DEFAULT 'completed'::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 75898)
-- Name: user_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_balances (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    balance_usd text DEFAULT '0'::text,
    total_earned text DEFAULT '0'::text,
    total_withdrawn text DEFAULT '0'::text,
    faucetpay_email text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_balances OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 75911)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(36) NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    email_verified boolean DEFAULT false,
    verification_token text,
    analytics_unlock_expiry timestamp without time zone,
    is_admin boolean DEFAULT false,
    is_banned boolean DEFAULT false,
    referral_code character varying(10),
    referred_by character varying(36),
    social_verified boolean DEFAULT false,
    social_verified_at timestamp without time zone,
    telegram_username text,
    password_reset_token text,
    password_reset_expiry timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 75927)
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawal_requests (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    amount_usd text NOT NULL,
    coin_type text NOT NULL,
    faucetpay_email text NOT NULL,
    status text DEFAULT 'pending'::text,
    admin_notes text,
    tx_hash text,
    requested_at timestamp without time zone DEFAULT now(),
    processed_at timestamp without time zone
);


ALTER TABLE public.withdrawal_requests OWNER TO postgres;

--
-- TOC entry 5042 (class 0 OID 75708)
-- Dependencies: 217
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.announcements (id, message, type, is_active, priority, created_at) VALUES ('d1650b8a-eed3-4271-9934-ad55a64ddd84', 'Welcome to AdShrtPro! Start shortening URLs and earning today.', 'info', TRUE, 0, '2026-01-15 19:20:47.225');
INSERT INTO public.announcements (id, message, type, is_active, priority, created_at) VALUES ('a67ee78d-cd85-419f-af91-cbd4aead264b', 'Welcome to AdShrtPro! Start shortening URLs and earning today.', 'info', TRUE, 0, '2026-01-15 19:45:38.658');
INSERT INTO public.announcements (id, message, type, is_active, priority, created_at) VALUES ('1fe15f92-c4cf-442a-9279-cd3a8e7f6538', 'Welcome to AdShrtPro! Start shortening URLs and earning today.', 'info', TRUE, 0, '2026-01-15 19:51:02.475');
INSERT INTO public.announcements (id, message, type, is_active, priority, created_at) VALUES ('a832d95b-e68c-4674-9972-d51d76eb242f', 'Welcome to AdShrtPro! Start shortening URLs and earning today.', 'info', TRUE, 0, '2026-01-15 19:51:53.511');
INSERT INTO public.announcements (id, message, type, is_active, priority, created_at) VALUES ('8ff7f99d-27d7-4dfd-bd9a-bec236c74896', 'Welcome to AdShrtPro! Start shortening URLs and earning today.', 'info', TRUE, 0, '2026-01-17 21:51:20.039');


--
-- TOC entry 5043 (class 0 OID 75719)
-- Dependencies: 218
-- Data for Name: banned_ips; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5044 (class 0 OID 75729)
-- Dependencies: 219
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.blog_posts (id, title, slug, content, excerpt, featured_image, is_published, created_at, updated_at) VALUES ('7f5c2389-a4d9-4d8e-af86-c2397db9058b', 'Welcome to AdShrtPro', 'welcome-to-adshrtpro', 'Welcome to AdShrtPro, the ultimate URL shortening platform with earning features!', 'Get started with AdShrtPro today.', NULL, TRUE, '2026-01-15 19:20:47.216', '2026-01-15 19:20:47.218121');
INSERT INTO public.blog_posts (id, title, slug, content, excerpt, featured_image, is_published, created_at, updated_at) VALUES ('530ed207-1fa2-403a-8db6-9fc258fef045', 'How to earn with AdShrtPro', 'how-to-earn-with-adshrtpro', 'Learn different ways to earn by shortening links, completing tasks, and referring friends.', 'Earning tips for AdShrtPro users.', NULL, TRUE, '2026-01-17 21:51:20.035', '2026-01-17 21:51:20.036799');
INSERT INTO public.blog_posts (id, title, slug, content, excerpt, featured_image, is_published, created_at, updated_at) VALUES ('ebee465b-a2e5-47b7-84fd-9f1d9937e5b6', 'Testing Admin Access', 'testing-admin-access', 'This is the content of the blog, the blog is for testing purposes and checking database connection.', 'This is a Brief summary of this post', 'https://images.unsplash.com/photo-1761839257165-44f08ed617c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw4fHx8ZW58MHx8fHx8', TRUE, '2026-01-17 22:32:27.222', '2026-01-17 22:32:27.222');


--
-- TOC entry 5045 (class 0 OID 75741)
-- Dependencies: 220
-- Data for Name: clicks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5046 (class 0 OID 75749)
-- Dependencies: 221
-- Data for Name: custom_ads; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5047 (class 0 OID 75758)
-- Dependencies: 222
-- Data for Name: earning_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.earning_settings (id, key, value) VALUES ('d9a80f10-a2b9-49b6-8027-277c4b42b90e', 'minWithdrawal', 1.00);
INSERT INTO public.earning_settings (id, key, value) VALUES ('ddd379c0-010c-4bdf-b114-1907dd22b5a1', 'referralBonus', 0.10);
INSERT INTO public.earning_settings (id, key, value) VALUES ('6ac629cf-1ded-4ecb-8354-4294337f5674', 'socialVerificationBonus', 0.05);
INSERT INTO public.earning_settings (id, key, value) VALUES ('8663f1a5-d429-4a3b-a98c-407b94f52388', 'taskCompletionBonus', 0.01);


--
-- TOC entry 5048 (class 0 OID 75767)
-- Dependencies: 223
-- Data for Name: links; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.links (id, original_url, short_code, user_id, creator_ip, is_disabled, is_banned, expires_at, created_at) VALUES ('2e8d53c4-9c6d-4909-a6e2-6e085b6a4487', 'https://example.com/welcome', 'IDRIS1', '7220c33a-459e-4799-a177-1df6427da055', NULL, FALSE, FALSE, NULL, '2026-01-17 21:51:20.196');
INSERT INTO public.links (id, original_url, short_code, user_id, creator_ip, is_disabled, is_banned, expires_at, created_at) VALUES ('ad80ed2c-e7f3-4630-a060-abf1a894db16', 'https://example.com/offers', 'IDRIS2', '7220c33a-459e-4799-a177-1df6427da055', NULL, FALSE, FALSE, NULL, '2026-01-17 21:51:20.201');
INSERT INTO public.links (id, original_url, short_code, user_id, creator_ip, is_disabled, is_banned, expires_at, created_at) VALUES ('239b85b9-a794-4446-b707-1b4db800fc34', 'https://dev.business.linkrx.ca/', 'yqww3k', '25cd1cd0-9f06-4e7d-96eb-73594d1cfe34', '::1', FALSE, FALSE, NULL, '2026-01-17 22:07:04.975');
INSERT INTO public.links (id, original_url, short_code, user_id, creator_ip, is_disabled, is_banned, expires_at, created_at) VALUES ('cea81f27-e7ef-4f8b-a30f-e9b1b28b5d5e', 'https://inboxes.com/', 'gj7kis', 'bac64819-7845-424c-afa9-9db6d2d8b1de', '::1', FALSE, FALSE, NULL, '2026-01-17 22:37:10.147');


--
-- TOC entry 5049 (class 0 OID 75779)
-- Dependencies: 224
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.notifications (id, user_id, title, message, type, is_read, is_global, created_at) VALUES ('3bf6f203-df60-43a9-bcec-a4bbf3b36513', NULL, 'Testing Notification for all users', 'Nothing much', 'info', FALSE, TRUE, '2026-01-17 22:33:37.134');


--
-- TOC entry 5050 (class 0 OID 75790)
-- Dependencies: 225
-- Data for Name: offerwall_completions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5051 (class 0 OID 75798)
-- Dependencies: 226
-- Data for Name: offerwall_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5052 (class 0 OID 75809)
-- Dependencies: 227
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.rate_limits (id, ip, month, count) VALUES ('cad69cc3-83c9-4ae4-8d88-99b9207aea66', '::1', '2026-01', 2);


--
-- TOC entry 5053 (class 0 OID 75817)
-- Dependencies: 228
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5054 (class 0 OID 75827)
-- Dependencies: 229
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.site_settings (id, key, value) VALUES ('16afea5f-51ba-4820-b940-646f2f688173', 'site_name', 'AdShrtPro');


--
-- TOC entry 5055 (class 0 OID 75836)
-- Dependencies: 230
-- Data for Name: social_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.social_verifications (id, user_id, screenshot_links, status, admin_notes, submitted_at, reviewed_at) VALUES ('9bed7722-fa71-411e-a643-10da2123f171', '25cd1cd0-9f06-4e7d-96eb-73594d1cfe34', 'https://inboxes.com/', 'pending', NULL, '2026-01-17 22:18:52.252', NULL);


--
-- TOC entry 5056 (class 0 OID 75847)
-- Dependencies: 231
-- Data for Name: sponsored_post_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5057 (class 0 OID 75855)
-- Dependencies: 232
-- Data for Name: sponsored_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5058 (class 0 OID 75870)
-- Dependencies: 233
-- Data for Name: task_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5059 (class 0 OID 75879)
-- Dependencies: 234
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tasks (id, title, description, instructions, requirements, proof_instructions, reward_usd, proof_type, is_active, max_completions, completed_count, created_at) VALUES ('8674892a-cf1d-4fa4-af8c-37b311831b0d', 'Follow us on Twitter', 'Follow @AdShrtPro on Twitter for updates', '1. Follow our Twitter accountn2. Take a screenshotn3. Submit the proof', NULL, NULL, 0.05, 'screenshot', TRUE, NULL, 0, '2026-01-15 19:20:47.23');
INSERT INTO public.tasks (id, title, description, instructions, requirements, proof_instructions, reward_usd, proof_type, is_active, max_completions, completed_count, created_at) VALUES ('5f5fddf3-a1cc-4d1d-a1bd-ed7d7946ad28', 'Follow us on Twitter', 'Follow @AdShrtPro on Twitter for updates', '1. Follow our Twitter accountn2. Take a screenshotn3. Submit the proof', NULL, NULL, 0.05, 'screenshot', TRUE, NULL, 0, '2026-01-15 19:45:38.664');
INSERT INTO public.tasks (id, title, description, instructions, requirements, proof_instructions, reward_usd, proof_type, is_active, max_completions, completed_count, created_at) VALUES ('94100193-881b-4c3e-847d-7370a7f93320', 'Follow us on Twitter', 'Follow @AdShrtPro on Twitter for updates', '1. Follow our Twitter accountn2. Take a screenshotn3. Submit the proof', NULL, NULL, 0.05, 'screenshot', TRUE, NULL, 0, '2026-01-15 19:51:02.504');
INSERT INTO public.tasks (id, title, description, instructions, requirements, proof_instructions, reward_usd, proof_type, is_active, max_completions, completed_count, created_at) VALUES ('cfd1dda0-f914-46d0-9a15-eac51b7b16cd', 'Follow us on Twitter', 'Follow @AdShrtPro on Twitter for updates', '1. Follow our Twitter accountn2. Take a screenshotn3. Submit the proof', NULL, NULL, 0.05, 'screenshot', TRUE, NULL, 0, '2026-01-15 19:51:53.553');
INSERT INTO public.tasks (id, title, description, instructions, requirements, proof_instructions, reward_usd, proof_type, is_active, max_completions, completed_count, created_at) VALUES ('cb93d2b2-33f5-4e5f-b8db-41e32f79dae9', 'Follow us on Twitter', 'Follow @AdShrtPro on Twitter for updates', '1. Follow our Twitter accountn2. Take a screenshotn3. Submit the proof', NULL, NULL, 0.05, 'screenshot', TRUE, NULL, 0, '2026-01-17 21:51:20.046');


--
-- TOC entry 5060 (class 0 OID 75889)
-- Dependencies: 235
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5061 (class 0 OID 75898)
-- Dependencies: 236
-- Data for Name: user_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('9f43c460-3d7a-469e-b971-0000bd64b47f', 'bac64819-7845-424c-afa9-9db6d2d8b1de', 0.00, 0.00, 0.00, NULL, '2026-01-15 19:20:47.18802');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('a94956cf-765e-4045-a17c-d020d5e0db62', 'e78c503b-ab29-4786-8c9a-3237cb8cf47b', 0.00, 0.00, 0.00, NULL, '2026-01-15 19:45:38.465871');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('3ebbd89d-5b23-47d1-8fb8-9f9ec339818f', '6bc0d646-0f4e-4f2d-9af5-4668b4d1d17a', 0.00, 0.00, 0.00, NULL, '2026-01-15 19:51:01.981164');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('bbd109f7-02fd-466d-9523-114dc785e502', '7317bc06-18e2-4ebb-a88c-2fb3bac1bb9e', 0.00, 0.00, 0.00, NULL, '2026-01-15 19:51:53.420292');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('a3bcc87c-65b6-4747-97c1-f49591f2984b', '123f8bbb-6ad3-49ea-9dcc-bdd4090eb342', 0, 0, 0, NULL, '2026-01-15 20:40:36.068682');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('0d2f98ee-f630-49d0-80f7-6c98973c3dba', 'fca52619-c5e1-4736-88f0-b430ce60f7f9', 0, 0, 0, NULL, '2026-01-15 20:48:52.64943');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('1b3acfc6-c95a-4ad4-8373-f6db253f8428', 'c3565111-5404-4d9e-a337-185a50cea1f0', 0.00, 0.00, 0.00, NULL, '2026-01-17 21:51:20.00746');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('82543cd2-b3dc-4c9f-bbbd-5471e2fd4ded', '7220c33a-459e-4799-a177-1df6427da055', 0.00, 0.00, 0.00, NULL, '2026-01-17 21:51:20.195565');
INSERT INTO public.user_balances (id, user_id, balance_usd, total_earned, total_withdrawn, faucetpay_email, updated_at) VALUES ('4d73c484-62c5-4e3e-b0ba-2428ffe674f7', '25cd1cd0-9f06-4e7d-96eb-73594d1cfe34', 0, 0, 0, NULL, '2026-01-17 22:05:51.103059');


--
-- TOC entry 5062 (class 0 OID 75911)
-- Dependencies: 237
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, email, password, email_verified, verification_token, analytics_unlock_expiry, is_admin, is_banned, referral_code, referred_by, social_verified, social_verified_at, telegram_username, password_reset_token, password_reset_expiry, created_at) VALUES ('bac64819-7845-424c-afa9-9db6d2d8b1de', 'admin@adshrtpro.com', '$2b$10$.2LtqkTUJhOb9ReFHWK9WONOYdPRKzLOOxcCcjklP5jMpgcMrAeMK', TRUE, NULL, NULL, TRUE, FALSE, 'ADMIN001', NULL, FALSE, NULL, NULL, NULL, NULL, '2026-01-15 19:20:46.901');
INSERT INTO public.users (id, email, password, email_verified, verification_token, analytics_unlock_expiry, is_admin, is_banned, referral_code, referred_by, social_verified, social_verified_at, telegram_username, password_reset_token, password_reset_expiry, created_at) VALUES ('123f8bbb-6ad3-49ea-9dcc-bdd4090eb342', 'idrisaloma120@gmail.com', '$2b$10$od6hpcxJYC.r3EJ3uEcRY.LjC6ND3QrkSQTifNti5bGVDPGf4w/Uq', FALSE, 'c312abaf-9b17-49d0-90bd-e22586da6638', NULL, FALSE, FALSE, 'N0HFRUZE', NULL, FALSE, NULL, NULL, NULL, NULL, '2026-01-15 20:40:35.967');
INSERT INTO public.users (id, email, password, email_verified, verification_token, analytics_unlock_expiry, is_admin, is_banned, referral_code, referred_by, social_verified, social_verified_at, telegram_username, password_reset_token, password_reset_expiry, created_at) VALUES ('fca52619-c5e1-4736-88f0-b430ce60f7f9', 'kerama4162@spicysoda.com', '$2b$10$801CJVhxq/.IG4BTZ0i/jeyOxK3KrZno11LdtC7K1R9LZrlyCiXZ6', FALSE, 'b5ea3249-f7ef-4edf-9176-02619f31dc32', NULL, FALSE, FALSE, 'R1K8IXOJ', NULL, FALSE, NULL, NULL, NULL, NULL, '2026-01-15 20:48:52.567');
INSERT INTO public.users (id, email, password, email_verified, verification_token, analytics_unlock_expiry, is_admin, is_banned, referral_code, referred_by, social_verified, social_verified_at, telegram_username, password_reset_token, password_reset_expiry, created_at) VALUES ('25cd1cd0-9f06-4e7d-96eb-73594d1cfe34', 'idrisaloma@vomoto.com', '$2b$10$YgCf44r6qTlPj4jggnNEUuAkuFgMhy9fRsJNJokVJoHipXPWJkbB.', FALSE, '06c5cf1a-32e1-465d-a7f6-518c9846e974', '2026-01-17 23:12:08.212', FALSE, FALSE, 'G5XVRPBG', NULL, FALSE, NULL, NULL, '$2b$10$qbQyR3950BmaBTBULUVFnON285jUN9VL27apVtpqguUsE4x1BJ6BC', '2026-01-17 23:42:04.509', '2026-01-17 22:05:51.06');


--
-- TOC entry 5063 (class 0 OID 75927)
-- Dependencies: 238
-- Data for Name: withdrawal_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 4834 (class 2606 OID 75718)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 75728)
-- Name: banned_ips banned_ips_ip_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banned_ips
    ADD CONSTRAINT banned_ips_ip_unique UNIQUE (ip);


--
-- TOC entry 4838 (class 2606 OID 75726)
-- Name: banned_ips banned_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banned_ips
    ADD CONSTRAINT banned_ips_pkey PRIMARY KEY (id);


--
-- TOC entry 4840 (class 2606 OID 75738)
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 75740)
-- Name: blog_posts blog_posts_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);


--
-- TOC entry 4844 (class 2606 OID 75748)
-- Name: clicks clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clicks
    ADD CONSTRAINT clicks_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 75757)
-- Name: custom_ads custom_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_ads
    ADD CONSTRAINT custom_ads_pkey PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 75766)
-- Name: earning_settings earning_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_settings
    ADD CONSTRAINT earning_settings_key_unique UNIQUE (key);


--
-- TOC entry 4850 (class 2606 OID 75764)
-- Name: earning_settings earning_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_settings
    ADD CONSTRAINT earning_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 75776)
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 75778)
-- Name: links links_short_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_short_code_unique UNIQUE (short_code);


--
-- TOC entry 4856 (class 2606 OID 75789)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 75797)
-- Name: offerwall_completions offerwall_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offerwall_completions
    ADD CONSTRAINT offerwall_completions_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 75808)
-- Name: offerwall_settings offerwall_settings_network_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offerwall_settings
    ADD CONSTRAINT offerwall_settings_network_unique UNIQUE (network);


--
-- TOC entry 4862 (class 2606 OID 75806)
-- Name: offerwall_settings offerwall_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offerwall_settings
    ADD CONSTRAINT offerwall_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 75816)
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 75826)
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 75835)
-- Name: site_settings site_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_unique UNIQUE (key);


--
-- TOC entry 4870 (class 2606 OID 75833)
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4872 (class 2606 OID 75844)
-- Name: social_verifications social_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_verifications
    ADD CONSTRAINT social_verifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 75846)
-- Name: social_verifications social_verifications_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_verifications
    ADD CONSTRAINT social_verifications_user_id_unique UNIQUE (user_id);


--
-- TOC entry 4876 (class 2606 OID 75854)
-- Name: sponsored_post_reactions sponsored_post_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsored_post_reactions
    ADD CONSTRAINT sponsored_post_reactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 75869)
-- Name: sponsored_posts sponsored_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsored_posts
    ADD CONSTRAINT sponsored_posts_pkey PRIMARY KEY (id);


--
-- TOC entry 4880 (class 2606 OID 75878)
-- Name: task_submissions task_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4882 (class 2606 OID 75888)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4884 (class 2606 OID 75897)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4886 (class 2606 OID 75908)
-- Name: user_balances user_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_balances
    ADD CONSTRAINT user_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 4888 (class 2606 OID 75910)
-- Name: user_balances user_balances_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_balances
    ADD CONSTRAINT user_balances_user_id_unique UNIQUE (user_id);


--
-- TOC entry 4890 (class 2606 OID 75924)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 4892 (class 2606 OID 75922)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 75926)
-- Name: users users_referral_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_unique UNIQUE (referral_code);


--
-- TOC entry 4896 (class 2606 OID 75935)
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


-- Completed on 2026-01-18 00:50:11

--
-- PostgreSQL database dump complete
--

