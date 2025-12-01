--
-- PostgreSQL database dump
--

\restrict tWkUZ5iWgT5tBvpE2Y7k1DQNddTyyF7irNZX24scPAgIZREUhxfifk2wFnxHx2h

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

INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (1, 'text_input', 'medium', 'TypeScript', '<p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">What&nbsp;does&nbsp;an&nbsp;interface&nbsp;compile&nbsp;to&nbsp;in&nbsp;JavaScript?</span></p>', '<p><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Nothing</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">.&nbsp;Interfaces&nbsp;exist&nbsp;only&nbsp;in&nbsp;TypeScript’s&nbsp;type&nbsp;system&nbsp;and&nbsp;are&nbsp;completely&nbsp;removed&nbsp;during&nbsp;compilation,&nbsp;so&nbsp;they&nbsp;produce&nbsp;no&nbsp;JavaScript&nbsp;output.</span></p>', '{nothing}', true, '2025-12-01 11:55:35.526087+00', '2025-12-01 12:02:24.261831+00');
INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (2, 'multiple_choice', 'easy', 'HTTP', '<p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">What&nbsp;are&nbsp;the&nbsp;HTTP&nbsp;status&nbsp;code&nbsp;categories?</span></p>', '<ul><li><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">1xx</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">&nbsp;–&nbsp;Informational</span></li><li><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">2xx</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">&nbsp;–&nbsp;Success</span></li><li><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">3xx</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">&nbsp;–&nbsp;Redirection</span></li><li><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">4xx</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">&nbsp;–&nbsp;Client&nbsp;Errors</span></li><li><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">5xx</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">&nbsp;–&nbsp;Server&nbsp;Errors</span></li></ul>', '{}', true, '2025-12-01 12:01:12.758809+00', '2025-12-01 12:33:50.86847+00');
INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (3, 'single_choice', 'hard', 'Microservices', '<p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">What&nbsp;is&nbsp;CQRS?</span></p>', '<p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">CQRS&nbsp;is&nbsp;an&nbsp;architectural&nbsp;pattern&nbsp;that&nbsp;separates&nbsp;write&nbsp;operations&nbsp;(commands)&nbsp;from&nbsp;read&nbsp;operations&nbsp;(queries)&nbsp;so&nbsp;they&nbsp;can&nbsp;be&nbsp;optimized&nbsp;and&nbsp;scaled&nbsp;independently.</span></p><p><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Instead&nbsp;of&nbsp;using&nbsp;the&nbsp;same&nbsp;model/database&nbsp;for&nbsp;both&nbsp;reading&nbsp;and&nbsp;writing,&nbsp;CQRS&nbsp;splits&nbsp;them.</span></p><p><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Write&nbsp;Model&nbsp;(Commands)</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">:</span></p><ul><li><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Handles&nbsp;state&nbsp;changes</span></li><li><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Validates&nbsp;business&nbsp;rules</span></li><li><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Usually&nbsp;updates&nbsp;the&nbsp;domain&nbsp;model</span></li><li><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Emits&nbsp;events&nbsp;(often&nbsp;used&nbsp;with&nbsp;Event&nbsp;Sourcing)</span></li></ul><p><strong style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Read&nbsp;Model&nbsp;(Queries)</strong><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">:</span></p><ul><li><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Handles&nbsp;fetching&nbsp;data</span></li><li><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">&nbsp;Uses&nbsp;fast,&nbsp;denormalized,&nbsp;query-optimized&nbsp;views</span></li><li><span style="background-color: rgb(255, 255, 255); color: rgb(0, 128, 0);">Can&nbsp;have&nbsp;multiple&nbsp;read&nbsp;databases</span></li></ul>', '{}', true, '2025-12-01 12:13:33.327738+00', '2025-12-01 12:13:33.343557+00');
INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (4, 'single_choice', 'hard', 'NodeJS Event Loop', '<p>In&nbsp;a&nbsp;<strong>Node.js</strong>&nbsp;environment,&nbsp;what&nbsp;is&nbsp;the&nbsp;order&nbsp;of&nbsp;the&nbsp;console&nbsp;logs?</p><pre data-language="plain">
const fs = require(&#39;fs&#39;);

console.log(&#39;A&#39;);

setTimeout(() =&gt; {
  console.log(&#39;B&#39;);
}, 0);

fs.readFile(__filename, () =&gt; {
  console.log(&#39;C&#39;);

  setImmediate(() =&gt; {
    console.log(&#39;D&#39;);
  });

  setTimeout(() =&gt; {
    console.log(&#39;E&#39;);
  }, 0);

  Promise.resolve().then(() =&gt; {
    console.log(&#39;F&#39;);
  });

  process.nextTick(() =&gt; {
    console.log(&#39;G&#39;);
  });
});

Promise.resolve().then(() =&gt; {
  console.log(&#39;H&#39;);
});

process.nextTick(() =&gt; {
  console.log(&#39;I&#39;);
});

console.log(&#39;J&#39;);
</pre>', '<ol><li>Synchronous<ul><li><strong>A</strong></li><li>schedule&nbsp;setTimeout(B)</li><li>schedule&nbsp;fs.readFile(...,&nbsp;callback)</li><li>schedule&nbsp;Promise.then(H)</li><li>schedule&nbsp;process.nextTick(I)</li><li><strong>J</strong></li></ul></li><li>After&nbsp;main&nbsp;finishes<ul><li>process.nextTick&nbsp;queue&nbsp;→&nbsp;<strong>I</strong></li><li>then&nbsp;Promise&nbsp;microtasks&nbsp;→&nbsp;<strong>H</strong></li></ul></li><li>Timers&nbsp;phase<ul><li>setTimeout(B,&nbsp;0)&nbsp;→&nbsp;<strong>B</strong></li></ul></li><li>Poll&nbsp;phase:&nbsp;I/O&nbsp;callbacks<ul><li>fs.readFile&nbsp;callback&nbsp;runs:</li><li><strong>C</strong></li><li>schedule&nbsp;setImmediate(D)</li><li>schedule&nbsp;setTimeout(E)</li><li>schedule&nbsp;Promise.then(F)</li><li>schedule&nbsp;process.nextTick(G)</li><li>At&nbsp;the&nbsp;end&nbsp;of&nbsp;this&nbsp;callback:</li><li>process.nextTick&nbsp;queue&nbsp;→&nbsp;<strong>G</strong></li><li>then&nbsp;Promise&nbsp;microtasks&nbsp;→&nbsp;<strong>F</strong></li></ul></li><li>Check&nbsp;phase&nbsp;(setImmediate)<ul><li><strong>D</strong></li></ul></li><li>Next&nbsp;timers&nbsp;phase<ul><li><strong>E</strong></li></ul></li></ol><p></p>', '{}', true, '2025-12-01 12:30:30.103891+00', '2025-12-01 12:31:08.110275+00');


--
-- Data for Name: choices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1, 2, '1xx – Informational', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (2, 2, '2xx – Success', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (3, 2, '3xx – Redirection', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (4, 2, '4xx – Client Errors', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (5, 2, '5xx – Server Errors', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (6, 2, '4xx – Server Errors', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (7, 2, '5xx – Client Errors', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (8, 2, '2xx – SSL handshake completed', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (9, 2, '4xx – Firewall rejection', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (10, 2, '3xx – Load balancer routing', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (11, 2, '5xx – Fatal error', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (12, 3, 'CQRS separates writes (commands) and reads (queries) into different models so that changing data and reading data are handled independently.', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (13, 3, 'CQRS is an architecture that uses one database for writes and a different database for queries in order to increase performance.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (14, 3, 'CQRS is a design pattern where all state changes are stored as events instead of saving the current state.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (15, 3, 'CQRS is an architecture that requires message queues to process all write operations.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (16, 3, 'CQRS is a microservices-based architecture where one service handles writes and another handles reads.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (17, 3, 'CQRS is an approach where all commands are asynchronous and all queries are synchronous.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (18, 3, 'CQRS is a frontend architecture pattern that separates edit screens from view-only pages.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (19, 3, 'CQRS is simply CRUD with different names: queries are READ and commands are CREATE, UPDATE, DELETE.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (20, 4, 'A J I H B C G F D E', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (21, 4, 'A J H I B C G F D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (22, 4, 'A J I H C B G F D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (23, 4, 'A J I H B C F G D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (24, 4, 'A J I H B C G F E D', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (25, 4, 'A I J H B C G F D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (26, 4, 'A J I H B C G D F E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (27, 4, 'A J H I C B F G D E', false);


--
-- Name: choices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.choices_id_seq', 27, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict tWkUZ5iWgT5tBvpE2Y7k1DQNddTyyF7irNZX24scPAgIZREUhxfifk2wFnxHx2h

