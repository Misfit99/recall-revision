/* Generated from Core_Java_SDE2_Revision_Day4B_v2_dark.pdf by tools/extract_revision_pdf.py */
Revision.addUnit({
 "subject": "core-java",
 "id": "day-4b",
 "source": "Core_Java_SDE2_Revision_Day4B_v2_dark.pdf",
 "label": "Day 4B",
 "title": "Executors, CompletableFuture, Coordination and Design",
 "tagline": "Bounded queues, named threads, a rejection policy you chose on purpose, and never block inside the common pool.",
 "topics": "Thread pools · Backpressure · Futures · CompletableFuture · Synchronizers · BlockingQueue · Virtual threads · Design",
 "cards": [
  {
   "id": "4.0B",
   "title": "Words this day uses (read once, then skip)",
   "blocks": [
    {
     "type": "recall",
     "html": "Day 4A&#x27;s word box still applies (thread, blocking, park, happens-before). These are the extra words for today."
    },
    {
     "type": "p",
     "html": "<strong>Executor / thread pool.</strong> An object that owns a set of reusable worker threads. You hand it tasks (Runnables or Callables), and a free worker runs each one, so you do not create a new thread per task.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Work queue.</strong> The queue inside the pool where submitted tasks wait until a worker is free.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bounded / unbounded.</strong> A bounded queue has a maximum size; an unbounded one keeps growing until memory runs out.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Latency and throughput.</strong> Latency is how long one request takes. Throughput is how many requests finish per second.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bulkhead.</strong> Giving each downstream dependency (each database, each partner API) its own separate pool or limit, so one slow dependency cannot use up every thread, the way watertight compartments keep a ship afloat.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Backpressure.</strong> Any way of pushing back on whoever is sending work when you cannot keep up, instead of silently piling up work.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Idempotent.</strong> Doing it twice has the same effect as doing it once. Essential when a request may be retried.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Future.</strong> A handle to a result that will exist later. <code>get()</code> waits for it. (Callable, Day 4A card 4.1, is the task type that returns a value.)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Producer and consumer.</strong> The producer is whoever creates and submits work (the thread calling <code>submit</code> or <code>put</code>); the consumer is whoever takes and processes it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Semaphore</strong> (full card 4.18). A counter of permits: <code>new Semaphore(50)</code> allows 50 holders at once; <code>acquire()</code> takes a permit (waiting if none is left) and <code>release()</code> gives one back.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>SynchronousQueue.</strong> A queue with no storage at all: an item is handed directly from the thread that offers it to a thread that is already waiting to take it. If nobody is waiting, the offer fails.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Pool deadlock.</strong> Every worker in a pool waits for a subtask that sits in the same pool&#x27;s queue, so no worker is ever free to run it (Day 4A card 4.8).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Event loop.</strong> One thread that serves many connections by handling whichever one is ready (Netty, Spring WebFlux). If you block it, every connection it serves stops.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Thread confinement and message passing.</strong> Confinement: only one thread ever touches the data (a local variable, or one consumer per Kafka partition). Message passing: threads do not share data, they send each other copies through a queue or Kafka.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>LongAdder</strong> (Day 4A card 4.9). A counter that spreads updates over several cells so many threads can increment it without fighting; best for metrics.",
     "bullet": true
    }
   ]
  },
  {
   "id": "4.11",
   "title": "ThreadPoolExecutor: what happens when you submit a task",
   "blocks": [
    {
     "type": "recall",
     "html": "The rule is core, then queue, then max, then reject. If fewer than <code>corePoolSize</code> threads exist, the pool starts a new thread for the task (even if other threads are idle). Otherwise it puts the task in the work queue. Only when the queue is full does it start extra threads, up to <code>maximumPoolSize</code>. If it is already at max and the queue is full, the rejection policy decides what happens."
    },
    {
     "type": "p",
     "html": "<strong>The surprise this causes.</strong> With an unbounded queue (<code>new LinkedBlockingQueue&lt;&gt;()</code> with no size), the queue never fills, so the pool never grows beyond core. The max setting is dead configuration. Many people expect the opposite order (grow to max first, then queue), and that is a classic interview question.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The four rejection policies.</strong> AbortPolicy (the default) throws <code>RejectedExecutionException</code>, which a web API can turn into an HTTP 503. CallerRunsPolicy makes the thread that called <code>submit</code> run the task itself, which naturally slows down the producer. DiscardPolicy silently drops the task. DiscardOldestPolicy drops the oldest queued task and then retries submitting the new one, which suits &quot;only the latest data matters&quot; (for example price ticks).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Name your threads.</strong> Pass a ThreadFactory that names threads (<code>payment-pool-1</code>, <code>payment-pool-2</code>) and sets an UncaughtExceptionHandler. Thread dumps and logs then tell you immediately which pool is stuck.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>submit vs execute</strong> (Day 3 card 3.6). <code>submit()</code> stores a task&#x27;s exception inside the returned Future, so nothing is logged unless someone calls <code>get()</code>. <code>execute()</code> lets the exception reach the thread&#x27;s uncaught exception handler.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>keepAliveTime.</strong> Threads above the core count that stay idle this long are stopped. Core threads stay forever, unless you call <code>allowCoreThreadTimeOut(true)</code>.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "new ThreadPoolExecutor(\n    8, 32,                                  // core 8, max 32\n    60, TimeUnit.SECONDS,                   // idle extra threads die after 60 s\n    new ArrayBlockingQueue<>(500),          // BOUNDED queue, so max can actually be reached\n    namedThreadFactory(\"payment-pool\"),     // a small ThreadFactory you write (or Spring's CustomizableThreadFactory)\n    new ThreadPoolExecutor.CallerRunsPolicy());"
    },
    {
     "type": "sayit",
     "html": "Below the core size it starts a thread; otherwise it queues the task; only when the queue is full does it add threads up to max; and at max with a full queue it rejects. So with an unbounded queue, max is never reached. I use a bounded queue, named threads and a deliberately chosen rejection policy."
    }
   ]
  },
  {
   "id": "4.12",
   "title": "The Executors shortcuts, pool sizing and Little's law",
   "blocks": [
    {
     "type": "recall",
     "html": "The <code>Executors</code> factory methods hide dangerous defaults. <code>newFixedThreadPool(n)</code> and <code>newSingleThreadExecutor()</code> use an unbounded queue, so under overload the queue grows until the heap runs out (OutOfMemoryError). <code>newCachedThreadPool()</code> has core 0, an unlimited max, and a SynchronousQueue (card 4.0B: it stores nothing), so it creates one thread for every task running at the same moment, until the OS refuses (<code>OutOfMemoryError: unable to create new native thread</code>; newer JDKs word it as unable to create native thread, possibly out of memory or process limits reached). In production, build a ThreadPoolExecutor yourself (card 4.11)."
    },
    {
     "type": "p",
     "html": "<strong>Sizing for CPU-bound work</strong> (calculations, parsing): about one thread per core. More threads only add switching overhead.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Sizing for I/O-bound work</strong> (database and HTTP calls): threads ≈ cores × (1 + wait time / compute time). A task that waits 90 ms on a database and computes for 10 ms on an 8-core machine gives 8 × (1 + 9) = 80 threads.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Little&#x27;s law: in-flight = arrival rate × time in the system.</strong> At 500 requests per second, each taking 40 ms, about 500 × 0.04 = 20 requests are in progress at any moment, so you need about 20 threads. It is a quick, convincing way to justify a number in an interview.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>How the two numbers fit together.</strong> Little&#x27;s law tells you how many requests are in flight at your real load, so that is the minimum number of threads you need. The cores formula tells you how many threads keep the CPUs busy for this kind of work, beyond which extra threads add no speed. Start from Little&#x27;s law plus some headroom, check it against the cores formula, and cap it at what the downstream dependency can take.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The real ceiling is usually downstream.</strong> 200 threads calling a database whose connection pool has 20 connections just means 180 threads waiting for a connection. Size the pool to the dependency, and give each dependency its own pool (a bulkhead, card 4.0B).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Containers.</strong> <code>Runtime.getRuntime().availableProcessors()</code> respects Docker and Kubernetes CPU limits (the CPU quota, <code>limits.cpu</code>) since JDK 10 (cgroup v2 support arrived in JDK 15, and in backports 11.0.16 and 8u372). On older JVMs it reported the host&#x27;s core count, so pools came out far too large.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "I avoid the Executors shortcuts in production: fixed pools have an unbounded queue, and cached pools create unbounded threads. CPU-bound pools get about one thread per core; I/O-bound pools get cores times one plus the wait-to-compute ratio, sanity-checked with Little&#x27;s law. The real limit is the downstream dependency, so each dependency gets its own pool."
    }
   ]
  },
  {
   "id": "4.13",
   "title": "Backpressure: what to do when work arrives faster than you can process it",
   "blocks": [
    {
     "type": "recall",
     "html": "A queue does not add capacity. It only turns overload into waiting time (latency), and an unbounded queue turns it into an OutOfMemoryError. So bound the buffer, then choose how to push back: reject quickly, make the caller run the task, drop old data, limit concurrency with a Semaphore, rate-limit, or time out."
    },
    {
     "type": "p",
     "html": "<strong>Size the queue from your latency budget.</strong> If you process 1,000 tasks per second and a task may wait at most 200 ms in the queue, the queue should hold about 1,000 × 0.2 = 200 tasks. A bigger queue only means requests that time out anyway.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Where CallerRunsPolicy is dangerous.</strong> If the caller is a Kafka consumer thread, running the task itself may keep it from calling <code>poll()</code> within <code>max.poll.interval.ms</code>, so Kafka thinks the consumer died and rebalances the group. On an event-loop thread (Netty, WebFlux) it blocks every connection. The task also runs with the caller&#x27;s ThreadLocals (Day 4A card 4.10), such as its MDC, so its log lines carry the caller&#x27;s traceId instead of their own and become misleading.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A Semaphore bulkhead.</strong> Allow at most 50 concurrent calls to a partner API: create <code>Semaphore sem = new Semaphore(50);</code> (the 50 is the limit), then for each call <code>if (!sem.tryAcquire(100, MILLISECONDS)) throw new BusyException();</code> (wait at most 100 ms for one permit), then <code>try { call(); } finally { sem.release(); }</code>. Release only after a successful acquire, otherwise you raise the limit (card 4.18).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "A queue converts overload into latency, and an unbounded one into an OutOfMemoryError, so I bound it based on the latency budget and then choose backpressure explicitly: fail fast, caller-runs, shedding old work, a semaphore bulkhead, or rate limiting, with timeouts everywhere."
    }
   ]
  },
  {
   "id": "4.14",
   "title": "Future, cancel and shutting a pool down",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>future.get(2, SECONDS)</code> throwing TimeoutException only ends your wait; the task keeps running. To stop it, call <code>future.cancel(true)</code>, which interrupts the worker thread running it, and the task stops only if it responds to interrupts (Day 4A card 4.2)."
    },
    {
     "type": "p",
     "html": "<strong>After <code>cancel(true)</code>,</strong> <code>future.get()</code> throws <code>CancellationException</code> immediately, even if the task&#x27;s code is still running because it ignores interrupts.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>shutdown()</code></strong> stops accepting new tasks, but finishes the running ones and everything already queued. <strong><code>shutdownNow()</code></strong> stops accepting new tasks, interrupts the running ones, and returns the queued tasks that never started. <strong><code>close()</code></strong> (Java 19+, so you can use try-with-resources) calls <code>shutdown()</code> and waits for everything to finish.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Graceful shutdown pattern.</strong> <code>pool.shutdown(); if (!pool.awaitTermination(30, SECONDS)) { pool.shutdownNow(); pool.awaitTermination(10, SECONDS); }</code>. This gives running work a fair chance to finish, then forces the rest.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>invokeAll(tasks)</code></strong> waits until every task is done and returns all the Futures. <strong><code>invokeAny(tasks)</code></strong> returns the result of the first task to succeed and cancels the others.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "A timed get only bounds my wait; to stop the task I cancel with interrupt, and the task must honour interrupts. shutdown finishes running and queued work; shutdownNow interrupts running tasks and returns the queued ones. I shut down gracefully with awaitTermination, then shutdownNow."
    }
   ]
  },
  {
   "id": "4.15",
   "title": "Scheduled executors, ForkJoinPool and the common pool",
   "blocks": [
    {
     "type": "recall",
     "html": "If a task scheduled with <code>scheduleAtFixedRate</code> or <code>scheduleWithFixedDelay</code> throws, all its later runs are silently suppressed (Day 3 card 3.6), so wrap the body in try/catch. Fixed rate measures from the start of one run to the start of the next; runs never overlap, so a slow run just makes the next one start late. Fixed delay measures from the end of one run to the start of the next."
    },
    {
     "type": "p",
     "html": "<strong>Why not <code>java.util.Timer</code>.</strong> It has a single thread, and if one task throws an unchecked exception, that thread dies and every other scheduled task stops too. ScheduledThreadPoolExecutor replaced it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>ForkJoinPool.</strong> Each worker has its own double-ended queue of tasks. The owner adds and takes its own tasks at one end; a worker that runs out of work steals from the opposite end of a busy worker&#x27;s queue (work stealing), so owner and thief rarely collide. Inside a ForkJoin task, <code>ForkJoinTask.join()</code> (a different method from CompletableFuture&#x27;s <code>join</code>, card 4.16, but with the same meaning, wait for the result) lets the waiting worker run other pending tasks of the same pool meanwhile, so splitting work recursively does not cause pool deadlock. But a ForkJoin worker waiting on JDBC or HTTP simply blocks.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The common pool.</strong> <code>ForkJoinPool.commonPool()</code> is one JVM-wide pool whose parallelism (its target number of busy worker threads) is cores − 1, with a minimum of 1. Parallel streams use it, and so does every CompletableFuture <code>...Async</code> method called without an executor. If you block in it (a database call inside <code>supplyAsync</code> with no executor), every parallel stream and async stage in the whole application is starved.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "<code>CompletableFuture.supplyAsync(() -&gt; jdbc.query(...))</code> with no executor runs a blocking database call on the shared common pool. Always pass your own I/O executor: <code>supplyAsync(() -&gt; jdbc.query(...), ioPool)</code>."
    },
    {
     "type": "sayit",
     "html": "A periodic task that throws stops silently, so I catch inside it. Fixed rate is start-to-start without overlap, fixed delay is end-to-start. ForkJoinPool uses work-stealing deques, and its common pool serves parallel streams and default async stages, so I never block in it; blocking work gets its own executor."
    }
   ]
  },
  {
   "id": "4.16",
   "title": "CompletableFuture: chaining stages, and which thread runs them",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>thenApply</code> transforms the result (a function from T to U, like map). <code>thenCompose</code> chains a call that itself returns a CompletableFuture (a function from T to CompletableFuture&lt;U&gt;, like flatMap), so you get CompletableFuture&lt;U&gt; instead of a nested CompletableFuture&lt;CompletableFuture&lt;U&gt;&gt;. <code>thenCombine</code> merges two independent futures. <code>allOf</code> waits for all of N futures. <code>anyOf</code> completes as soon as any one completes, even if that one failed."
    },
    {
     "type": "p",
     "html": "<strong>It starts immediately.</strong> <code>supplyAsync(() -&gt; crm.load(id), io)</code> hands the task to the executor right away and returns a future. So two <code>supplyAsync</code> calls written one after the other run in parallel. Your thread only waits when it calls <code>join()</code> or <code>get()</code>; chaining with <code>thenApply</code> and friends just registers the next step and returns immediately.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>allOf</code> returns CompletableFuture&lt;Void&gt;.</strong> It tells you when everything is done, but not the values. Afterwards, call <code>join()</code> on each original future to collect the results (they are already complete, so <code>join()</code> does not wait).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Which thread runs a non-async stage</strong> (<code>thenApply</code>, <code>thenAccept</code>...). The thread that completes the previous stage runs it. But if the previous stage is already complete when you attach the stage, your own calling thread runs it right away.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Which thread runs an <code>...Async</code> stage.</strong> The executor you pass, as in <code>thenApplyAsync(x -&gt; enrich(x), io)</code>. If you pass none, the common pool (card 4.15); if the common pool has fewer than 2 threads (a 1- or 2-core container), Java creates a new thread for every task instead.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Context does not travel.</strong> MDC, the security context and the Spring transaction live in ThreadLocals (Day 4A card 4.10), so a stage on another thread starts without them. In particular, a JPA repository call inside <code>supplyAsync</code> does not run in the caller&#x27;s <code>@Transactional</code> transaction; it runs in its own transaction or none.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "CompletableFuture<Customer> c = CompletableFuture.supplyAsync(() -> crm.load(id), io);   // starts now\nCompletableFuture<Limits>   l = CompletableFuture.supplyAsync(() -> risk.limits(id), io); // runs in parallel\nCompletableFuture<Offer> offer = c.thenCombine(l, (cust, lim) -> pricing.offer(cust, lim)); // needs both\nCompletableFuture<Receipt> r = offer.thenCompose(o -> payments.chargeAsync(o));          // returns a CF"
    },
    {
     "type": "sayit",
     "html": "thenApply maps a value, thenCompose flat-maps a function that returns another future, thenCombine joins two independent futures, and allOf and anyOf wait for all or the first. supplyAsync starts immediately on the given executor. Non-async stages run on whichever thread completed the previous stage, or on the caller if it&#x27;s already done, so I always pass explicit executors for blocking work."
    }
   ]
  },
  {
   "id": "4.17",
   "title": "CompletableFuture: errors and timeouts",
   "blocks": [
    {
     "type": "recall",
     "html": "When a stage fails, every stage chained after it is skipped and fails too, until one that handles errors. The handler usually receives a <code>CompletionException</code> wrapping the real exception, so unwrap it with <code>getCause()</code>, but only when it actually is a CompletionException. <code>join()</code> throws <code>CompletionException</code>; <code>get()</code> throws the checked <code>ExecutionException</code>."
    },
    {
     "type": "p",
     "html": "<strong>When you get the wrapper and when you do not.</strong> If the code inside <code>supplyAsync</code> throws, or the failure comes from an earlier stage, the handler sees a CompletionException with the real error as its cause. If someone called <code>future.completeExceptionally(ex)</code> directly on the future you attached the handler to, the handler sees <code>ex</code> itself. So always unwrap defensively: <code>Throwable cause = (e instanceof CompletionException &amp;&amp; e.getCause() != null) ? e.getCause() : e;</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Timeouts do not stop work.</strong> <code>SECONDS)</code> makes the future fail with",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<code>orTimeout(2,</code> TimeoutException; <code>completeOnTimeout(defaultValue, 2, SECONDS)</code> completes it with a fallback value (both Java 9). Neither one stops the underlying work. And <code>cancel(true)</code> on a CompletableFuture never interrupts anything: unlike the FutureTask behind an executor&#x27;s Future (card 4.14), a CompletableFuture is not tied to the thread doing the work, so it cannot interrupt it; it just marks itself cancelled. Put real timeouts on the HTTP client or JDBC call itself.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>allOf</code> waits for everyone, even after one fails.</strong> It completes only when all futures are done, and then fails if any failed. For fail-fast behaviour, create your own CompletableFuture and complete it exceptionally from the first failure: <code>var failFast = new CompletableFuture&lt;Void&gt;(); for (var f : futures) f.exceptionally(e -&gt; { failFast.completeExceptionally(e); return null; }); CompletableFuture.anyOf(failFast, CompletableFuture.allOf(futures)).join();</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A failure nobody handles or joins is silently lost.</strong> No log, no exception anywhere. End every chain with <code>join()</code>, a handler, or at least a <code>whenComplete</code> that logs.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>Method</strong>",
      "<strong>Runs when</strong>",
      "<strong>What it can do</strong>"
     ],
     "rows": [
      [
       "<code>exceptionally(e -&gt; fallback)</code>",
       "Only on failure",
       "Replace the failure with a fallback value. On success the value passes through untouched."
      ],
      [
       "<code>handle((value, e) -&gt; ...)</code>",
       "Always",
       "Turn either outcome into a new value (the exception argument is null on success)."
      ],
      [
       "<code>whenComplete((value, e) -&gt; ...)</code>",
       "Always",
       "Observe only, for logging or metrics; the original result or failure passes through. If the action itself throws after a success, the stage fails with a CompletionException wrapping that exception; if the stage had already failed, the original failure passes through."
      ],
      [
       "<code>exceptionallyCompose(e -&gt; otherFuture)</code>",
       "Only on failure (Java 12+)",
       "Switch to a fallback asynchronous call, for example a secondary service."
      ]
     ]
    },
    {
     "type": "code",
     "code": "CompletableFuture<Quote> q = CompletableFuture\n    .supplyAsync(() -> primary.quote(req), io)\n    .orTimeout(800, MILLISECONDS)                          // fail the future after 800 ms (work keeps running)\n    .exceptionallyCompose(e -> backup.quoteAsync(req))      // fall back to a second provider\n    .whenComplete((v, e) -> { if (e != null) log.warn(\"quote failed\", e); });\n// After a timeout the primary call is still running while the backup runs. Fine for a read-only\n// quote; for a payment, never fire a second charge unless the first is known to have failed."
    },
    {
     "type": "sayit",
     "html": "A failure skips the following stages until exceptionally, handle, or exceptionallyCompose, and handlers usually receive a CompletionException I unwrap. orTimeout and completeOnTimeout only complete the future; they don&#x27;t stop the work, and cancel never interrupts, so real timeouts go on the HTTP or JDBC call. Unhandled failures vanish silently."
    }
   ]
  },
  {
   "id": "4.18",
   "title": "CountDownLatch, CyclicBarrier, Semaphore and Phaser",
   "blocks": [
    {
     "type": "recall",
     "html": "CountDownLatch is one-shot: threads calling <code>await()</code> wait until <code>countDown()</code> has been called N times, and it can never be reset. CyclicBarrier makes N threads wait for each other at a meeting point, and it can be reused for the next round. Semaphore holds N permits that limit how many threads may do something at once, and a permit has no owner."
    },
    {
     "type": "p",
     "html": "<strong>CountDownLatch in practice.</strong> &quot;Start processing only after 3 caches have loaded.&quot; Use <code>await(timeout, unit)</code> so a failed loader cannot hang you forever, put <code>countDown()</code> in a <code>finally</code> block, and record failures separately (the latch counts down for failures too).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>CyclicBarrier in practice.</strong> N worker threads each compute one part of a simulation step, then wait at the barrier until all N arrive, then start the next step together. An optional barrier action runs once per round, by the last thread to arrive. If one waiting thread is interrupted or times out, the barrier breaks, and every other waiting thread gets <code>BrokenBarrierException</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Semaphore permits are not owned.</strong> Any thread may call <code>release()</code>, even one that never acquired. So an extra <code>release()</code> silently raises the limit (5 permits become 6), and a missing one leaks a permit forever. Always release in <code>finally</code>, and only after a successful acquire.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Phaser (bonus).</strong> A reusable barrier whose number of parties can change at any time: threads <code>register()</code> to join and <code>arriveAndDeregister()</code> to leave, and it counts phases (rounds).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>They all create happens-before</strong> (Day 4A card 4.3): everything before <code>countDown()</code> is visible after <code>await()</code> returns, and everything before <code>release()</code> is visible to the thread that next acquires.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "A CountDownLatch is a one-shot gate that opens after N countDowns. A CyclicBarrier is a reusable meeting point for N threads that breaks for everyone if one fails. A Semaphore limits concurrency with N unowned permits, so I release in finally only after a successful acquire. All of them provide happens-before."
    }
   ]
  },
  {
   "id": "4.19",
   "title": "BlockingQueue and producer-consumer",
   "blocks": [
    {
     "type": "recall",
     "html": "A BlockingQueue is a thread-safe queue that can make threads wait. <code>put(x)</code> waits while the queue is full, and <code>take()</code> waits while it is empty. <code>offer(x)</code> and <code>poll()</code> never wait; they return false or null instead. <code>add(x)</code> and <code>remove()</code> throw an exception instead. No BlockingQueue allows null, because <code>poll()</code> uses null to mean &quot;nothing there&quot;. The full set is in the table."
    },
    {
     "type": "p",
     "html": "<strong>The main implementations.</strong> ArrayBlockingQueue: bounded, one lock for both ends. LinkedBlockingQueue: two locks (one for put, one for take) so producers and consumers do not block each other, but unbounded unless you give it a capacity. PriorityBlockingQueue and DelayQueue (an item can only be taken after its delay has expired): unbounded. SynchronousQueue: zero capacity, so <code>put</code> waits until a <code>take</code> receives the item directly (a hand-off).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Stopping consumers cleanly: the poison pill.</strong> The producer puts one special marker object per consumer at the end of the queue. Each consumer stops when it takes a pill, comparing with <code>==</code> against that one marker object. Because the queue is first-in-first-out, all real work ahead of the pills is processed first.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why the cached pool explodes</strong> (card 4.12). Its idle workers wait in <code>poll(60, SECONDS)</code> on a SynchronousQueue. When a task arrives and no worker is idle, <code>offer</code> fails (nobody is there to take it), and the ThreadPoolExecutor treats that as &quot;queue full&quot; and starts a new thread.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Batching.</strong> <code>queue.drainTo(list, 500)</code> moves up to 500 waiting items in one call, ideal for batch database inserts.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Other concurrent collections.</strong> CopyOnWriteArrayList for read-mostly lists (every write copies the whole array, Day 2 card 2.6). ConcurrentSkipListMap as a sorted concurrent map (the thread-safe TreeMap). ConcurrentLinkedQueue is a non-blocking queue built on CAS, and its <code>size()</code> is O(n) because it must count.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>When the queue is full / empty</strong>",
      "<strong>Throws</strong>",
      "<strong>Returns false / null</strong>",
      "<strong>Waits forever</strong>",
      "<strong>Waits up to a limit</strong>"
     ],
     "rows": [
      [
       "Insert",
       "<code>add(x)</code>",
       "<code>offer(x)</code>",
       "<code>put(x)</code>",
       "<code>offer(x, time, unit)</code>"
      ],
      [
       "Remove",
       "<code>remove()</code>",
       "<code>poll()</code>",
       "<code>take()</code>",
       "<code>poll(time, unit)</code>"
      ]
     ]
    },
    {
     "type": "code",
     "code": "static final Order POISON = new Order();                      // one shared marker object\n// producer\nfor (Order o : orders) queue.put(o);                          // waits if the queue is full\nfor (int i = 0; i < consumers; i++) queue.put(POISON);         // one pill per consumer\n// each consumer\nwhile (true) {\n    Order o = queue.take();                                   // waits if empty\n    if (o == POISON) break;                                   // compare by identity\n    process(o);\n}"
    },
    {
     "type": "sayit",
     "html": "BlockingQueue&#x27;s put and take wait when full or empty, offer and poll return immediately, and nulls are banned. ArrayBlockingQueue is bounded with one lock, LinkedBlockingQueue uses two locks and is unbounded unless sized, and SynchronousQueue is a pure hand-off. I stop consumers with one poison pill per consumer, so queued work finishes first."
    }
   ]
  },
  {
   "id": "4.20",
   "title": "Virtual threads (Java 21)",
   "blocks": [
    {
     "type": "recall",
     "html": "A virtual thread is a very cheap thread scheduled by the JVM, not the operating system. When it blocks on I/O, the JVM unmounts it from the platform thread (the carrier) that was running it, and the carrier runs another virtual thread meanwhile. So code written in a simple blocking style can handle huge numbers of concurrent requests."
    },
    {
     "type": "p",
     "html": "<strong>How to use them.</strong> <code>Executors.newVirtualThreadPerTaskExecutor()</code> gives a new virtual thread for every task. In Spring Boot 3.2+, set <code>spring.threads.virtual.enabled=true</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Do not pool them.</strong> They are cheap to create, so pooling buys nothing. If you used a pool to limit load on a database, use a Semaphore for that instead (card 4.13).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>No gain for CPU-bound work.</strong> They help with waiting, not computing; the number of carriers is still about the number of cores.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Pinning (Java 21 to 23).</strong> If a virtual thread blocks while inside a <code>synchronized</code> block, it cannot unmount and holds its carrier (it is pinned), which can starve the carriers. In those versions, use ReentrantLock on hot paths that block. Java 24 fixed this for synchronized (JEP 491). Native calls still pin.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>ThreadLocals</strong> cost memory per virtual thread (Day 4A card 4.10).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Virtual threads are JVM-scheduled and unmount from their carrier when they block on I/O, so blocking-style code scales to many concurrent requests. I don&#x27;t pool them, I limit downstream load with a semaphore, they don&#x27;t help CPU-bound work, and on Java 21 to 23 blocking inside synchronized pins the carrier, so I&#x27;d use ReentrantLock on those paths."
    }
   ]
  },
  {
   "id": "4.21",
   "title": "Design: choosing a strategy, money transfer and idempotency",
   "blocks": [
    {
     "type": "recall",
     "html": "Prefer the simplest concurrency strategy that works, in this order: immutability, then thread confinement, then message passing, then concurrent collections, then atomics, and only then locks. For a money transfer: inside one JVM, lock both accounts in id order. With many service instances, move the locking to the database (row locks or a version column) or route each account to a single writer. For auditability, use an append-only ledger."
    },
    {
     "type": "p",
     "html": "<strong>Pessimistic locking with JPA.</strong> <code>@Lock(LockModeType.PESSIMISTIC_WRITE)</code> on the repository method turns into <code>SELECT ... FOR UPDATE</code>, which locks the rows until the transaction ends. Lock the lower account id first (the Day 4A card 4.8 rule, applied to rows), and still retry on a database deadlock error, because other code paths may lock in a different order.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Optimistic locking.</strong> A <code>@Version</code> column: each update checks that the version is unchanged and increments it. If another transaction got there first, you get an OptimisticLockException and retry. This is best when conflicts are rare.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Single writer per partition.</strong> Route all operations for an account to one consumer (for example, a Kafka partition keyed by account id). It debits, sends a credit message to the other account&#x27;s writer, and if that writer replies with a failure message, compensates (reverses the debit). Every step must be idempotent, because messages can be redelivered.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The idempotency key.</strong> The client sends a unique key per logical request (for example a UUID). Store it in the same database transaction as the debit, in a column with a unique constraint, together with the result. A retried request then hits the constraint, and you return the stored result instead of debiting twice. Catch the duplicate-key error outside the @Transactional method, because after the constraint violation that transaction can only roll back; then read the stored result in a new transaction. If the first request is still in progress, its row says IN_PROGRESS, and you answer &quot;still processing&quot; (HTTP 409 or 202) instead of charging again.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>&quot;Exactly once&quot; in practice</strong> means at-least-once delivery plus idempotent processing.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "I prefer immutability and confinement over locks. For transfers in one JVM I lock accounts in id order; across instances I use database row locks or optimistic versioning, or a single writer per account. Every payment request carries an idempotency key stored with a unique constraint in the same transaction, so a retry returns the stored result instead of charging twice."
    }
   ]
  },
  {
   "id": "4.22",
   "title": "Classic coding problems to write from memory",
   "blocks": [
    {
     "type": "recall",
     "html": "Be able to write these without notes: a thread-safe counter three ways (synchronized, AtomicLong, LongAdder); a bounded buffer with one Lock and two Conditions; odd/even printing with two Semaphores; producer-consumer with a BlockingQueue (card 4.19); and a token-bucket rate limiter."
    },
    {
     "type": "p",
     "html": "<strong>Token bucket, in words.</strong> The bucket holds up to <code>capacity</code> tokens and refills at <code>rate</code> tokens per second. On each request, first add the tokens earned since the last refill, <code>(now − last) × rate</code>, capped at capacity. If at least one token is left, take it and allow the request; otherwise reject it (HTTP 429). Use <code>System.nanoTime()</code>, which only moves forward, not the wall clock, which can jump. One bucket per client: a ConcurrentHashMap of buckets with eviction of idle clients. Many service instances: keep the bucket in Redis.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Odd/even with two Semaphores.</strong> <code>odd</code> starts with 1 permit and <code>even</code> with 0. The odd thread acquires <code>odd</code>, prints, and releases <code>even</code>; the even thread acquires <code>even</code>, prints, and releases <code>odd</code>. The permits force them to alternate.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "// Bounded buffer: one lock, two conditions (wake exactly the right side)\nfinal Lock lock = new ReentrantLock();\nfinal Condition notFull = lock.newCondition(), notEmpty = lock.newCondition();\nvoid put(T x) throws InterruptedException {\n    lock.lock();\n    try { while (count == items.length) notFull.await();   // while, never if\n          items[putIdx] = x; putIdx = (putIdx + 1) % items.length; count++;\n          notEmpty.signal(); }\n    finally { lock.unlock(); }\n}   // take() is the mirror image: wait on notEmpty, signal notFull\n// Token bucket\nsynchronized boolean tryAcquire() {\n    long now = System.nanoTime();\n    tokens = Math.min(capacity, tokens + (now - last) * ratePerNano);\n    last = now;\n    if (tokens >= 1) { tokens -= 1; return true; }\n    return false;                                           // caller answers HTTP 429\n}"
    },
    {
     "type": "sayit",
     "html": "I can write a bounded buffer with a ReentrantLock and notFull and notEmpty conditions, using while loops around await, odd-even printing with two semaphores starting at one and zero, and a token bucket that refills based on elapsed nanoTime, capped at capacity, kept per client in a ConcurrentHashMap or in Redis across instances."
    }
   ]
  }
 ],
 "quiz": [
  {
   "q": "Core 8, max 32, unbounded queue, 5,000 slow tasks. How many threads run?",
   "a": "8. The unbounded queue never fills, so the pool never adds threads beyond core; 4,992 tasks wait in the queue."
  },
  {
   "q": "Why is <code>Executors.newCachedThreadPool()</code> dangerous under load?",
   "a": "Its SynchronousQueue cannot hold tasks, so every task that finds no idle worker gets a new thread, with no upper limit, until the OS refuses to create more."
  },
  {
   "q": "500 requests per second, each taking 40 ms. About how many threads do you need, and by what law?",
   "a": "About 20, by Little&#x27;s law: in-flight = rate × time = 500 × 0.04."
  },
  {
   "q": "<code>future.get(2, SECONDS)</code> throws TimeoutException. Is the task still running? What do you add?",
   "a": "Yes, only your wait ended. Call future.cancel(true) and make sure the task responds to interrupts."
  },
  {
   "q": "<code>thenApply</code> vs <code>thenCompose</code>?",
   "a": "thenApply maps the value with a function returning a plain value; thenCompose chains a function that returns another CompletableFuture and flattens it, avoiding CompletableFuture&lt;CompletableFuture&lt;T&gt;&gt;."
  },
  {
   "q": "You add <code>orTimeout(1, SECONDS)</code> to a slow JDBC call wrapped in supplyAsync. Does the query stop after 1 second?",
   "a": "No. The future fails with TimeoutException, but the query keeps running. Set a timeout on the JDBC statement or the HTTP client."
  },
  {
   "q": "What happens if you call <code>release()</code> on a Semaphore more times than <code>acquire()</code>?",
   "a": "Permits are not owned, so each extra release adds a permit and silently raises the limit."
  },
  {
   "q": "How do you stop 4 consumer threads reading from a BlockingQueue so that queued work still finishes?",
   "a": "Put 4 poison pills (one per consumer) at the end of the queue; each consumer exits when it takes one, after the real work ahead of them."
  },
  {
   "q": "A <code>thenApply</code> is attached to a future that is already complete. Which thread runs it?",
   "a": "The thread that attached it (your calling thread), immediately. If the future was not yet complete, the thread that completes it runs the stage."
  },
  {
   "q": "Inside <code>exceptionally(e -&gt; ...)</code> after a failing supplyAsync, what is <code>e</code>?",
   "a": "Usually a CompletionException wrapping the real exception. Unwrap getCause() when e is a CompletionException."
  },
  {
   "q": "Why can CallerRunsPolicy hurt a Kafka consumer?",
   "a": "The consumer thread runs the rejected task itself, may not call poll() within max.poll.interval.ms, and Kafka rebalances the group."
  },
  {
   "q": "On Java 21, a virtual thread blocks on a database call inside a synchronized block. What is the problem?",
   "a": "It is pinned to its carrier thread and cannot unmount, so carriers can run out. Use ReentrantLock there, or upgrade to Java 24+."
  },
  {
   "q": "Why is lock ordering by account id not enough when the service runs as 3 instances?",
   "a": "Each JVM has its own locks, so two instances can update the same account at once. The lock must move to the database (row locks or versioning) or to a single writer per account."
  },
  {
   "q": "A client retries a payment after a timeout. How do you avoid charging twice?",
   "a": "An idempotency key stored in the same transaction as the debit, with a unique constraint and the stored result; the retry hits the constraint and gets the stored result back (read in a new transaction)."
  }
 ]
});
