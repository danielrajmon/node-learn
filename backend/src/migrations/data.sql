--
-- PostgreSQL database dump
--

\restrict 8G8j3XdfzesCNgbALK1dwacbeXciXq7oZiA7Rq5h0oLW2AXc9J74e80VbAQdU9F

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (1, 'single_choice', 'medium', 'Docker', '<p>Docker</p>', '<p>Docker</p>', '{}', true, '2025-11-30 21:30:16.041834+00', '2025-11-30 21:36:16.536085+00');


--
-- Data for Name: choices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1, 1, 'Docker', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (2, 1, '1', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (3, 1, '2', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (4, 1, '3', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (5, 1, '4', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (6, 1, '5', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (7, 1, '6', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (8, 1, '7', false);


--
-- Name: choices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.choices_id_seq', 8, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 8G8j3XdfzesCNgbALK1dwacbeXciXq7oZiA7Rq5h0oLW2AXc9J74e80VbAQdU9F

