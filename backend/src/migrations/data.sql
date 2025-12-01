--
-- PostgreSQL database dump
--

\restrict vkJlbRU36wfDLviDGS08BzT941gH405Y1KOIRqMUq81ymoMKyCfykpW7gyxwP2U

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

INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (5, 'text_input', 'easy', 'HTTP', '<p>What&nbsp;HTTP&nbsp;request&nbsp;methods&nbsp;do&nbsp;you&nbsp;know?</p>', '<ul><li>GET</li><li>POST</li><li>PUT</li><li>DELETE</li><li>PATCH</li></ul>', '{GET,POST,PUT,PATCH,DELETE}', true, '2025-12-01 19:40:39.375932+00', '2025-12-01 20:48:30.46126+00');
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
INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (1, 'text_input', 'medium', 'TypeScript', '<p><span style="background-color: rgb(255, 255, 255);">What&nbsp;does&nbsp;an&nbsp;interface&nbsp;compile&nbsp;to&nbsp;in&nbsp;JavaScript?</span></p>', '<p><strong>Nothing</strong>.&nbsp;Interfaces&nbsp;exist&nbsp;only&nbsp;in&nbsp;TypeScript’s&nbsp;type&nbsp;system&nbsp;and&nbsp;are&nbsp;completely&nbsp;removed&nbsp;during&nbsp;compilation,&nbsp;so&nbsp;they&nbsp;produce&nbsp;no&nbsp;JavaScript&nbsp;output.</p>', '{nothing}', true, '2025-12-01 11:55:35.526087+00', '2025-12-01 21:57:20.662165+00');
INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (3, 'single_choice', 'hard', 'Microservices', '<p><span style="background-color: rgb(255, 255, 255);">What&nbsp;is&nbsp;CQRS?</span></p>', '<p>CQRS&nbsp;is&nbsp;an&nbsp;architectural&nbsp;pattern&nbsp;that&nbsp;separates&nbsp;write&nbsp;operations&nbsp;(commands)&nbsp;from&nbsp;read&nbsp;operations&nbsp;(queries)&nbsp;so&nbsp;they&nbsp;can&nbsp;be&nbsp;optimized&nbsp;and&nbsp;scaled&nbsp;independently.</p><p>Instead&nbsp;of&nbsp;using&nbsp;the&nbsp;same&nbsp;model/database&nbsp;for&nbsp;both&nbsp;reading&nbsp;and&nbsp;writing,&nbsp;CQRS&nbsp;splits&nbsp;them.</p><p></p><p><strong>Write&nbsp;Model&nbsp;(Commands):</strong></p><ul><li>Handles&nbsp;state&nbsp;changes</li><li>Validates&nbsp;business&nbsp;rules</li><li>Usually&nbsp;updates&nbsp;the&nbsp;domain&nbsp;model</li><li>Emits&nbsp;events&nbsp;(often&nbsp;used&nbsp;with&nbsp;Event&nbsp;Sourcing)</li></ul><p><strong>Read&nbsp;Model&nbsp;(Queries):</strong></p><ul><li>Handles&nbsp;fetching&nbsp;data</li><li>&nbsp;Uses&nbsp;fast,&nbsp;denormalized,&nbsp;query-optimized&nbsp;views</li><li>Can&nbsp;have&nbsp;multiple&nbsp;read&nbsp;databases</li></ul>', '{}', true, '2025-12-01 12:13:33.327738+00', '2025-12-01 21:56:18.783373+00');
INSERT INTO public.questions (id, question_type, difficulty, topic, question_text, long_answer, match_keywords, is_active, created_at, updated_at) VALUES (2, 'multiple_choice', 'easy', 'HTTP', '<p><span style="background-color: rgb(255, 255, 255);">Which&nbsp;are&nbsp;HTTP&nbsp;status&nbsp;code&nbsp;categories?</span></p>', '<ul><li><strong>1xx</strong>:&nbsp;Informational</li><li><strong>2xx</strong>:&nbsp;Success</li><li><strong>3xx</strong>:&nbsp;Redirection</li><li><strong>4xx</strong>:&nbsp;Client&nbsp;Errors</li><li><strong>5xx</strong>:&nbsp;Server&nbsp;Errors</li></ul>', '{}', true, '2025-12-01 12:01:12.758809+00', '2025-12-01 21:57:13.17479+00');


--
-- Data for Name: choices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1176, 3, 'CQRS separates writes (commands) and reads (queries) into different models so that changing data and reading data are handled independently.', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1177, 3, 'CQRS is an architecture that uses one database for writes and a different database for queries in order to increase performance.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1178, 3, 'CQRS is a design pattern where all state changes are stored as events instead of saving the current state.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1179, 3, 'CQRS is an architecture that requires message queues to process all write operations.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1180, 3, 'CQRS is a microservices-based architecture where one service handles writes and another handles reads.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1181, 3, 'CQRS is an approach where all commands are asynchronous and all queries are synchronous.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1182, 3, 'CQRS is a frontend architecture pattern that separates edit screens from view-only pages.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1183, 3, 'CQRS is simply CRUD with different names: queries are READ and commands are CREATE, UPDATE, DELETE.', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (20, 4, 'A J I H B C G F D E', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (21, 4, 'A J H I B C G F D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (22, 4, 'A J I H C B G F D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (23, 4, 'A J I H B C F G D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (24, 4, 'A J I H B C G F E D', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (25, 4, 'A I J H B C G F D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (26, 4, 'A J I H B C G D F E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (27, 4, 'A J H I C B F G D E', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1184, 2, '3xx – Redirection', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1185, 2, '4xx – Client Errors', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1186, 2, '4xx – Server Errors', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1187, 2, '5xx – Client Errors', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1188, 2, '2xx – SSL handshake completed', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1189, 2, '4xx – Firewall rejection', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1190, 2, '3xx – Load balancer routing', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1191, 2, '5xx – Fatal error', false);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1192, 2, '5xx – Server Errors', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1193, 2, '1xx – Informational', true);
INSERT INTO public.choices (id, question_id, choice_text, is_good) VALUES (1194, 2, '2xx – Success', true);


--
-- Name: choices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.choices_id_seq', 1194, true);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

\unrestrict vkJlbRU36wfDLviDGS08BzT941gH405Y1KOIRqMUq81ymoMKyCfykpW7gyxwP2U

