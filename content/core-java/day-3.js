/* Generated from Core_Java_SDE2_Revision_Day3_v2_dark.pdf by tools/extract_revision_pdf.py */
Revision.addUnit({
 "subject": "core-java",
 "id": "day-3",
 "source": "Core_Java_SDE2_Revision_Day3_v2_dark.pdf",
 "label": "Day 3",
 "title": "Exceptions, finally, I/O and Serialization",
 "tagline": "Most trick answers on this day are either \"it does not compile\" or \"finally replaced it\".",
 "topics": "Exceptions · finally · try-with-resources · @Transactional · I/O · NIO · Serialization",
 "cards": [
  {
   "id": "3.0",
   "title": "Words this day uses (read once, then skip)",
   "blocks": [
    {
     "type": "recall",
     "html": "A few words below come from other topics. This box gives you just enough of each to read today&#x27;s cards."
    },
    {
     "type": "p",
     "html": "<strong>Stack trace.</strong> The list of method calls that were active when the exception was created, printed as the <code>at com.x.Foo.bar(Foo.java:42)</code> lines. Recording it is the expensive part of creating an exception.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Decorator.</strong> An object that wraps another object of the same type and adds behaviour. <code>new BufferedReader(new FileReader(f))</code>: the BufferedReader is a Reader that wraps another Reader and adds buffering. java.io is built entirely from these layers.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Spring proxy.</strong> When a bean has <code>@Transactional</code>, Spring does not hand out your object directly. In Spring Boot it generates a subclass of your class at runtime (with a library called CGLIB) whose methods wrap yours: start the transaction, call your real method, then commit or roll back. So the proxy is both a subclass and a wrapper. It can only wrap methods it is able to override, and anything that skips it skips the transaction.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Interrupt flag.</strong> Every thread has a boolean &quot;someone asked me to stop&quot; flag. <code>thread.interrupt()</code> sets it. Blocking calls such as <code>Thread.sleep</code> or <code>take()</code> on a BlockingQueue (a thread-safe queue that waits until an item arrives, Day 4) notice it and throw <code>InterruptedException</code>. (Day 4 covers this fully.)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bytes vs characters.</strong> A file or socket holds bytes. Text is characters. Turning bytes into characters needs a charset (an encoding such as UTF-8) that says which bytes mean which character.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Off-heap memory.</strong> Memory the JVM allocates outside the normal object heap. The garbage collector moves heap objects around to compact memory, but it never moves off-heap memory. The operating system reads and writes I/O data at a fixed memory address, so it can work directly on off-heap memory; for an ordinary heap <code>byte[]</code>, the JVM must first copy the bytes into a temporary off-heap buffer (that is the &quot;extra copy&quot;).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>System call.</strong> A request from your program to the operating system (read these bytes from the file, send these bytes on the socket). Each one is relatively slow, which is why buffering many bytes per call matters.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Channel (NIO).</strong> The NIO version of a stream: a two-way connection to a file or socket that reads into and writes from ByteBuffers. Socket channels can be switched to non-blocking mode, where a read returns immediately with whatever is available (possibly nothing) instead of waiting.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bonus vocabulary</strong> in this sheet is marked (bonus): a name to recognise if an interviewer says it, not something you must explain.",
     "bullet": true
    }
   ]
  },
  {
   "id": "3.1",
   "title": "The Throwable family; checked vs unchecked",
   "blocks": [
    {
     "type": "recall",
     "html": "Everything you can throw extends <code>Throwable</code>, which has two branches. <code>Error</code> means the JVM itself is in trouble (OutOfMemoryError, StackOverflowError); you normally do not catch it. <code>Exception</code> is for problems your program can deal with, and inside it <code>RuntimeException</code> is the branch for programming bugs. &quot;Checked&quot; is a rule enforced by the compiler (javac), not a property the JVM knows about."
    },
    {
     "type": "p",
     "html": "<strong>Which exceptions are checked.</strong> Everything except the <code>RuntimeException</code> subtree and the <code>Error</code> subtree. For a checked exception, the compiler forces every caller either to catch it or to declare it with <code>throws</code>. A class that extends <code>Throwable</code> directly is also checked, and <code>catch (Exception e)</code> does not catch it, because it is not an Exception.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>When to use which.</strong> Checked exceptions are meant for conditions the caller can really recover from (a file that may be missing, a remote call that may fail and can be retried). Unchecked exceptions are for bugs and broken contracts (null where it is not allowed, an invalid argument). Today most code prefers unchecked: adding a checked exception changes every caller&#x27;s signature, it leaks low-level details through every layer, and lambdas cannot throw it (card 3.6). Spring&#x27;s whole <code>DataAccessException</code> hierarchy is unchecked, and Java 8 added <code>UncheckedIOException</code> so streams can carry I/O failures.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What exceptions cost.</strong> Entering a <code>try</code> block costs nothing: the compiler records in a side table (the exception table, bonus) which code range each catch covers, and the table is only looked at when something is thrown. Creating an exception is expensive, because its constructor calls <code>fillInStackTrace()</code>, which walks the whole call stack. So never use exceptions for normal control flow. For a high-volume exception that needs no trace, your exception class can call the protected four-argument constructor of Exception (RuntimeException and Throwable have the same one): <code>super(message, null, false, false)</code>. The arguments are the message, the cause (none), whether suppressed exceptions may be attached (false), and whether the stack trace is recorded (false).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Helpful NullPointerException messages.</strong> Since Java 14 (on by default from 15), an NPE says exactly what was null, for example <code>Cannot invoke &quot;String.length()&quot; because &quot;customer.name&quot; is null</code>. For a local variable, the real name only appears if the code was compiled with <code>-g</code> (debug info); otherwise you see <code>&lt;local1&gt;</code>.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>Exception</strong>",
      "<strong>Typical cause</strong>"
     ],
     "rows": [
      [
       "IllegalArgumentException",
       "A bad argument value. Throw it yourself when a precondition fails. NumberFormatException (<code>Integer.parseInt(&quot;12a&quot;)</code>) is a subclass."
      ],
      [
       "IllegalStateException",
       "The argument is fine but the object is in the wrong state, for example using a closed resource."
      ],
      [
       "ClassCastException",
       "A bad downcast, or heap pollution from raw generic types (Day 2: a raw List let the wrong type of object in, and it fails only when read). It often appears far from the real bug."
      ],
      [
       "ArithmeticException",
       "Integer division by zero, or a BigDecimal division with a never-ending result. Floating point never throws: 1.0 / 0 is Infinity and 0.0 / 0 is NaN."
      ],
      [
       "UnsupportedOperationException",
       "Changing <code>List.of(...)</code>, or calling <code>add</code> on <code>Arrays.asList(...)</code>."
      ],
      [
       "NoSuchElementException",
       "<code>iterator.next()</code> past the end, or <code>Optional.get()</code> on an empty Optional."
      ],
      [
       "ExecutionException / CompletionException",
       "Wrappers thrown by <code>Future.get()</code> / <code>CompletableFuture.join()</code>. The real error is in <code>getCause()</code>."
      ]
     ]
    },
    {
     "type": "trap",
     "html": "<strong>Missing stack traces in production logs.</strong> When hot code throws the same built-in exception (such as an NPE) at the same place many times, the JIT compiler starts throwing a pre-built exception object with no stack trace, to save time. This is controlled by the JVM flag <code>-XX:+OmitStackTraceInFastThrow</code>, which is on by default. If your logs suddenly show <code>NullPointerException</code> with no trace, scroll back to the first occurrence, which still has one, or restart with <code>-XX:-OmitStackTraceInFastThrow</code>."
    },
    {
     "type": "sayit",
     "html": "Throwable splits into Error, for JVM-level problems, and Exception. RuntimeException and its subclasses are unchecked and represent bugs; other exceptions are checked, which is purely a compiler rule forcing callers to catch or declare them. I use checked only for recoverable conditions. Entering try is free, but creating an exception is costly because it captures the stack trace."
    }
   ]
  },
  {
   "id": "3.2",
   "title": "catch rules, throw vs throws, and exceptions in overriding",
   "blocks": [
    {
     "type": "recall",
     "html": "Catch blocks must go from most specific to most general; putting a parent exception before its child is a compile error, because the child&#x27;s block could never run. Catching a checked exception that the try body cannot possibly throw is also a compile error. In a multi-catch (<code>catch (A | B e)</code>), A and B cannot be parent and child of each other, and <code>e</code> is implicitly final."
    },
    {
     "type": "p",
     "html": "<strong><code>try</code> needs a partner.</strong> A plain <code>try</code> must have at least one <code>catch</code> or a <code>finally</code>. A try-with-resources may have neither, because closing the resources is its built-in cleanup.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>throw</code> vs <code>throws</code>.</strong> <code>throw</code> is a statement that throws one exception object right now: <code>throw new IllegalStateException(&quot;closed&quot;);</code>. <code>throws</code> is part of a method&#x27;s signature, a declaration that this method may throw these checked exceptions: <code>void read() throws IOException</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Overriding rule.</strong> An overriding method may declare the same checked exceptions, fewer, or narrower ones (subclasses), or none at all. It may never add a new checked exception or a broader one. Reason: code that calls the method through the parent type only prepared for the parent&#x27;s list. Unchecked exceptions are not restricted.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The catch-Exception exception.</strong> The &quot;cannot throw&quot; compile error does not apply to <code>catch (Exception e)</code> or <code>catch (Throwable e)</code>, because those also cover unchecked exceptions, which any code can throw.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Precise rethrow (Java 7+).</strong> If you write <code>catch (Exception e) { log(e); throw e; }</code> and never reassign <code>e</code>, the compiler knows <code>e</code> can only be one of the checked exceptions the try body really throws. So the method only needs to declare those (for example <code>throws IOException</code>), not <code>throws Exception</code>. The try-with-resources sketch in card 3.4 relies on the same rule when it rethrows <code>t</code>.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Catch blocks go from specific to general, and catching a checked exception the body can&#x27;t throw doesn&#x27;t compile. throw is the statement that throws an object; throws declares checked exceptions in the signature. An override may declare fewer or narrower checked exceptions, never new or broader ones, because callers only prepared for the parent&#x27;s list."
    }
   ]
  },
  {
   "id": "3.3",
   "title": "What finally really does, and shutdown hooks",
   "blocks": [
    {
     "type": "recall",
     "html": "When a try block executes <code>return</code>, the value is computed and saved first, then <code>finally</code> runs, then the method returns the saved value. A <code>return</code> inside <code>finally</code> replaces that saved value, and it also silently discards any exception that was on its way out. An exception thrown inside <code>finally</code> replaces the original exception, which is lost completely; it is not even attached as suppressed (attached as an extra, secondary exception; card 3.4)."
    },
    {
     "type": "p",
     "html": "<strong>Why reassigning a variable in <code>finally</code> does not change the result.</strong> The returned value was already saved before <code>finally</code> started. If the value is a primitive, or a reference that you point elsewhere, the caller still gets what was saved. But if it is a reference to an object and <code>finally</code> changes that object (appends to a StringBuilder, adds to a list), the caller sees the change, because the saved reference points to the same object. See functions a() and b() below.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>When <code>finally</code> does not run.</strong> When the JVM stops: <code>System.exit()</code>, <code>Runtime.halt()</code>, a crash, or <code>kill -9</code>. When the try block never finishes (an infinite loop, or a thread blocked forever). And in a daemon thread (a background thread that does not keep the JVM alive) when the JVM exits while that thread is still inside the try.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Shutdown hooks: cleanup when the whole JVM stops.</strong> <code>Runtime.getRuntime().addShutdownHook(new Thread(() -&gt; flushAndClose()));</code> registers a thread that runs when the JVM shuts down normally: the last non-daemon thread ends, <code>System.exit()</code> is called, or the process gets Ctrl-C or SIGTERM (the polite stop signal Kubernetes sends to a pod before killing it). Hooks do not run on <code>kill -9</code> (SIGKILL) or <code>Runtime.halt()</code>. All hooks start together, in no fixed order, so keep each one short and independent. Spring Boot registers one to close the application context gracefully.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "// a() returns 1: the value was saved before finally ran\nint a() { int x = 1; try { return x; } finally { x = 2; } }\n// b() returns \"AB\": finally changed the same object\nStringBuilder b() { var sb = new StringBuilder(\"A\");\n                    try { return sb; } finally { sb.append(\"B\"); } }\n// c() returns 2: finally's return wins\nint c() { try { return 1; } finally { return 2; } }\n// d() returns 3: the exception vanishes\nint d() { try { throw new RuntimeException(); } finally { return 3; } }"
    },
    {
     "type": "trap",
     "html": "Calling <code>System.exit()</code> from inside a shutdown hook hangs the JVM forever: <code>exit</code> waits for the hooks to finish, and the hook is waiting for <code>exit</code>."
    },
    {
     "type": "sayit",
     "html": "finally runs after the try&#x27;s return value has been saved, so reassigning a variable doesn&#x27;t change it, but mutating the returned object does. A return in finally replaces the result and discards any exception, and an exception in finally replaces the original. For JVM-wide cleanup on SIGTERM I use a shutdown hook, which doesn&#x27;t run on kill -9."
    }
   ]
  },
  {
   "id": "3.4",
   "title": "try-with-resources",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>try (A a = ...; B b = ...) { body }</code> closes the resources automatically, in reverse order of declaration (b first, then a). If the body throws and a <code>close()</code> also throws, the body&#x27;s exception wins, and the close exception is attached to it as a suppressed exception (read it with <code>e.getSuppressed()</code>). Your own <code>catch</code> and <code>finally</code> blocks run after the resources are already closed."
    },
    {
     "type": "p",
     "html": "<strong>What can go in the brackets.</strong> Anything that implements <code>AutoCloseable</code> (one method, <code>close() throws Exception</code>). <code>Closeable</code> is the older I/O version, whose <code>close()</code> throws <code>IOException</code>; its documentation promises that calling it twice does no harm (a promise, not something the compiler checks).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Edge cases.</strong> If only <code>close()</code> throws (the body was fine), that exception is the one thrown. If a resource variable is null, Java simply skips closing it. Since Java 9 you can list an existing final or effectively-final variable: <code>try (conn) { ... }</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why it beats a hand-written finally.</strong> With <code>finally { in.close(); }</code>, an exception from <code>close()</code> would replace the body&#x27;s exception (card 3.3) and you would lose the real error. try-with-resources keeps the real error and attaches the close failure to it.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "// What the compiler roughly turns  try (var r = open()) { use(r); }  into:\nvar r = open();\nThrowable primary = null;\ntry { use(r); }\ncatch (Throwable t) { primary = t; throw t; }   // precise rethrow, card 3.2\nfinally {\n    if (r != null) {\n        if (primary != null) { try { r.close(); } catch (Throwable c) { primary.addSuppressed(c); } }\n        else r.close();\n    }\n}"
    },
    {
     "type": "trap",
     "html": "<code>try (var in = new GZIPInputStream(new FileInputStream(f)))</code> has only one resource, the outer GZIPInputStream. If the GZIP constructor throws (for example because the file is not valid gzip), the FileInputStream was already opened but is never registered, so it is never closed and the file handle leaks. Declare each layer as its own resource: <code>try (var fis = new FileInputStream(f); var in = new GZIPInputStream(fis))</code>."
    },
    {
     "type": "sayit",
     "html": "try-with-resources closes AutoCloseable resources in reverse order after the body and before my catch or finally. If both the body and close throw, the body&#x27;s exception propagates with the close failure attached as suppressed, so the real error is never lost. I declare each wrapped stream as its own resource so a failing outer constructor can&#x27;t leak the inner one."
    }
   ]
  },
  {
   "id": "3.5",
   "title": "Custom exceptions, chaining and the anti-patterns",
   "blocks": [
    {
     "type": "recall",
     "html": "A good custom exception extends <code>Exception</code> (if the caller can recover) or <code>RuntimeException</code> (for everything else). It offers a <code>(message, cause)</code> constructor, carries useful context in final fields (an order id, an error code), and never puts secrets such as card numbers or passwords in its message. At each layer boundary, translate a low-level exception into one that layer understands, always passing the original as the cause, and log each failure exactly once."
    },
    {
     "type": "p",
     "html": "<strong>Chaining, in practice.</strong> In the repository: <code>catch (SQLException e) { throw new OrderStoreException(&quot;save failed for &quot; + orderId, e); }</code>. The second argument, <code>e</code>, is the cause. The final stack trace then shows <code>Caused by: java.sql.SQLException ...</code> with the real database error underneath your message.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The anti-patterns, and what each one costs you.</strong> An empty catch block hides the failure completely. <code>throw new X(e.getMessage())</code> keeps the text but throws away the original stack trace (the cause). Logging and rethrowing at every layer prints the same error five times. <code>catch (Exception e)</code> deep inside business code also catches bugs you never meant to handle. Using exceptions for normal control flow is slow (card 3.1). A <code>return</code> in <code>finally</code> swallows exceptions (card 3.3).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>InterruptedException needs special handling.</strong> When a blocking call such as <code>Thread.sleep</code> or <code>queue.take()</code> throws InterruptedException, the blocking call also clears the thread&#x27;s interrupt flag (card 3.0). If you just catch it and carry on, the request to stop is forgotten. That breaks shutdown: <code>executor.shutdownNow()</code> works by interrupting each worker thread, so a task that swallows the interrupt keeps running and the pool never finishes stopping. So either let it propagate (declare <code>InterruptedException</code>), or restore the flag with <code>throws Thread.currentThread().interrupt();</code> and then return or stop.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "My custom exceptions carry context in fields, take a cause, and never contain secrets. I translate exceptions at layer boundaries while keeping the cause, and log each failure once, at the boundary that handles it. I never swallow InterruptedException: I either rethrow it or restore the interrupt flag."
    }
   ]
  },
  {
   "id": "3.6",
   "title": "Exceptions in awkward places",
   "blocks": [
    {
     "type": "recall",
     "html": "If a class&#x27;s static initializer throws, the first use of the class fails with <code>ExceptionInInitializerError</code> (if the initializer threw an <code>Error</code>, such as OutOfMemoryError, that Error is rethrown as it is). From then on the class is permanently broken, and every later use throws <code>NoClassDefFoundError: Could not initialize class X</code>, even though the class file is right there on the classpath. Since JDK 18, that NoClassDefFoundError has a cause that records the original failure&#x27;s message and stack trace, so you can see what went wrong the first time."
    },
    {
     "type": "p",
     "html": "<strong>Thread pools, <code>submit</code> vs <code>execute</code>.</strong> With <code>executor.submit(task)</code>, an exception thrown by the task is caught and stored inside the returned Future. Nothing is printed or logged unless someone calls <code>future.get()</code>, which then throws <code>ExecutionException</code> wrapping it. With <code>executor.execute(task)</code> on a normal ThreadPoolExecutor, the exception is not caught: it kills that worker thread (the pool starts a replacement) and goes to the thread&#x27;s uncaught exception handler, which prints it to standard error by default. (A ScheduledThreadPoolExecutor is different: it stores the exception even for <code>execute</code>.)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Periodic tasks die silently.</strong> If a task scheduled with <code>scheduleAtFixedRate</code> or <code>scheduleWithFixedDelay</code> throws even once, all its later runs are suppressed, quietly. The ScheduledFuture is marked as completed with that exception (not cancelled), and nothing is logged unless someone calls <code>get()</code> on it. Wrap the task body in try/catch and log the error, so one bad run does not stop the job forever. Spring&#x27;s <code>@Scheduled</code> is different: by default its scheduler catches, logs and suppresses the exception, so the next run still happens.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Lambdas and checked exceptions.</strong> The standard functional interfaces in <code>java.util.function</code> (Function, Consumer, Supplier...) declare no checked exceptions, so a lambda written for them cannot throw one; <code>list.forEach(f -&gt; Files.delete(f))</code> does not compile. Catch inside the lambda and rethrow as <code>UncheckedIOException</code>. Interfaces that do declare one, such as <code>Callable</code> (<code>call() throws Exception</code>), are fine.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A constructor that throws.</strong> <code>new</code> then returns nothing, so the caller gets no object. But if the constructor already handed <code>this</code> to someone (registered a listener, started a thread), that half-built object is still out there (Day 1 card 1.8).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "A failing static initializer gives ExceptionInInitializerError once and then NoClassDefFoundError for every later use. Exceptions from submitted tasks hide in the Future until get is called, a periodic task that throws stops forever silently, and lambdas for java.util.function interfaces can&#x27;t throw checked exceptions, so I wrap them in UncheckedIOException."
    }
   ]
  },
  {
   "id": "3.7",
   "title": "Spring @Transactional: what rolls back",
   "blocks": [
    {
     "type": "recall",
     "html": "By default, Spring rolls a transaction back when the method throws a <code>RuntimeException</code> or an <code>Error</code>, and commits it when the method throws a checked exception. And because transactions are applied by the Spring proxy (card 3.0), a call from one method to another inside the same class (<code>this.save()</code>) never passes through the proxy, so the second method&#x27;s <code>@Transactional</code> is ignored."
    },
    {
     "type": "p",
     "html": "<strong>Making checked exceptions roll back.</strong> Add <code>@Transactional(rollbackFor = InsufficientFundsException.class)</code>, or make the exception unchecked. Since Spring 6.2 you can change the default for the whole application: <code>@EnableTransactionManagement(rollbackOn = RollbackOn.ALL_EXCEPTIONS)</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Catching inside the method.</strong> If the method catches the exception itself and does not rethrow it, the proxy never sees a failure, so it commits. One exception, step by step: (1) <code>OrderService.place()</code> is @Transactional and starts a transaction. (2) It calls <code>PaymentService.charge()</code>, also @Transactional; with the default propagation (REQUIRED) charge() does not start its own transaction, it joins the caller&#x27;s. (3) charge() throws a RuntimeException, so the proxy around charge() marks the shared transaction rollback-only (a flag meaning &quot;this can only end in a rollback&quot;). (4) place() catches the exception and returns normally. (5) The proxy around place() tries to commit, finds the flag, rolls back, and throws <code>UnexpectedRollbackException</code>. In short: if an inner <code>@Transactional</code> method that joined the same transaction already threw a rollback-triggering exception (by default a RuntimeException or Error), it marked the transaction rollback-only. The outer method then tries to commit and gets <code>UnexpectedRollbackException</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Other ways the annotation is silently ignored.</strong> On a <code>private</code> method (the proxy subclass cannot override it, so it cannot wrap it). On a method called from the same class (self-invocation, above). On a class that Spring does not manage (created with <code>new</code>).",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "A transfer method debits account A, then throws the checked <code>InsufficientFundsException</code> while crediting account B. Because the exception is checked, Spring commits by default, and the debit stays without the credit. In payment code, either declare <code>rollbackFor</code> or use unchecked exceptions."
    },
    {
     "type": "sayit",
     "html": "By default Spring rolls back on RuntimeException and Error and commits on checked exceptions, so I set rollbackFor or use unchecked exceptions for business failures. @Transactional works through a proxy, so self-invocation and private methods bypass it, and swallowing an exception inside the method means the proxy commits."
    }
   ]
  },
  {
   "id": "3.8",
   "title": "I/O, NIO and NIO.2",
   "blocks": [
    {
     "type": "recall",
     "html": "Classic java.io is built from decorators (card 3.0). Byte streams (<code>InputStream</code>, <code>OutputStream</code>) move raw bytes; character streams (<code>Reader</code>, <code>Writer</code>) move text and need a charset to convert. You wrap layers to add features (buffering, decompression), and closing the outermost wrapper closes everything inside it."
    },
    {
     "type": "p",
     "html": "<strong>Always name the charset.</strong> <code>new InputStreamReader(in, StandardCharsets.UTF_8)</code>. Before Java 18 the default charset came from the operating system, so the same code could read text differently on a Windows laptop and a Linux server. Since Java 18 the default is UTF-8 on every operating system (console output is the exception, and <code>-Dfile.encoding=COMPAT</code> restores the old behaviour).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Buffer, and flush.</strong> Reading or writing one byte at a time without a <code>BufferedInputStream</code> or <code>BufferedReader</code> means one system call per byte, which is very slow. Writers keep data in a buffer, so if you do not <code>flush()</code> or <code>close()</code>, the end of the output is lost. <code>PrintWriter</code> never throws IOException; it just sets an error flag you must check with <code>checkError()</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>NIO ByteBuffer: three numbers.</strong> <code>capacity</code> is the total size. <code>position</code> is where the next read or write happens. <code>limit</code> is where reading or writing must stop. After writing data into a buffer, call <code>flip()</code> (it sets limit = position and position = 0) so you can read back what you wrote. To write again, <code>clear()</code> resets position and limit (the old bytes are not erased, just ignored), and <code>compact()</code> first moves any unread bytes to the start. Worked example, capacity 10: write 4 bytes → position 4, limit 10. <code>flip()</code> → position 0, limit 4. Read 2 bytes → position 2, limit 4. <code>compact()</code> → the 2 unread bytes move to index 0 and 1, position 2, limit 10, ready to write after them.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Direct buffers</strong> (<code>ByteBuffer.allocateDirect</code>) live in off-heap memory (card 3.0), which the operating system can use for I/O without the extra copy described in card 3.0. Their total size is capped by <code>-XX:MaxDirectMemorySize</code>, and they are freed only when the buffer object is garbage-collected.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Selector: one thread, many connections.</strong> A Selector lets one thread watch many non-blocking socket channels and handle whichever is ready to read or write. This is how Netty (bonus: a popular networking library) and other servers handle thousands of connections with few threads. <code>FileChannel</code> cannot be put in non-blocking mode, so it cannot be used with a Selector.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Memory-mapped files (bonus).</strong> <code>FileChannel.map(...)</code> makes a file appear as a <code>MappedByteBuffer</code> in memory. The whole file is not loaded at once: the operating system brings in pieces (pages) on demand as you touch them, so even a 10 GB file can be mapped. There is no public way to unmap it; the mapping goes away only when the buffer is garbage-collected, which on Windows can keep the file locked. Since Java 22, the Foreign Memory API can map a file into a <code>MemorySegment</code> tied to an <code>Arena</code>, and closing the arena unmaps it immediately.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>NIO.2 (<code>Path</code> and <code>Files</code>, Java 7+).</strong> <code>Files.lines</code>, <code>Files.list</code> and <code>Files.walk</code> return lazy streams that keep a file or directory handle open, so always use them in try-with-resources. For a safe file update, write to a temporary file, in the same directory (an atomic move cannot cross file systems), then <code>Files.move(tmp, target, ATOMIC_MOVE)</code>, so readers see either the whole old file or the whole new one. A <code>WatchService</code> notifies you when files in a directory are created, changed or deleted (on macOS it polls, so events can arrive seconds late).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "java.io is a stack of decorators: byte streams for raw data, readers and writers for text with an explicit charset, with buffering added on top. NIO adds ByteBuffers with position, limit and flip, direct off-heap buffers, and Selectors so one thread can serve many non-blocking sockets. With NIO.2 I close Files.lines and Files.walk streams, and use an atomic move for safe file replacement."
    }
   ]
  },
  {
   "id": "3.9",
   "title": "How Java serialization works, and serialVersionUID",
   "blocks": [
    {
     "type": "recall",
     "html": "When an object is read back (deserialized), no constructor of its Serializable class runs, and field initializers do not run either. Java only runs the no-argument constructor of the nearest parent class, going up from your class, that is not Serializable (often <code>Object</code>), then fills in the fields straight from the stream. <code>transient</code> fields come back as their default value (0, false or null), <code>static</code> fields are never written at all, and if two fields pointed to the same object before, they still point to one shared object after."
    },
    {
     "type": "p",
     "html": "<strong>Why <code>transient int retries = 3;</code> comes back as 0.</strong> The compiler copies every field initializer, such as <code>= 3</code>, into each constructor, so it is part of the constructor, which does not run on read, and transient means the value was never written. So the field keeps its default, 0.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>serialVersionUID.</strong> Always declare <code>private static final long serialVersionUID = 1L;</code>. If you do not, Java computes one from the class&#x27;s structure (its fields, methods, interfaces), so almost any edit, such as adding a non-private method or a new field, changes the number, and reading old data fails with <code>InvalidClassException</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Which class changes are safe, with a fixed serialVersionUID.</strong> Adding a field is safe: old data simply leaves it at its default. Removing or renaming a field loses that field&#x27;s old value (a rename is a remove plus an add). Changing a field&#x27;s type breaks reading.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The hook methods.</strong> <code>writeObject</code> and <code>readObject</code> must have exactly these private signatures: <code>private void writeObject(ObjectOutputStream out)</code> and <code>private void readObject(ObjectInputStream in)</code> customise what is written and read; <code>readObject</code> is where you validate the data, since no constructor checked it. <code>readResolve</code> and <code>writeReplace</code> may have any access modifier. <code>Object readResolve()</code> lets you swap the object that was just read for another one (for example, the singleton). <code>Object writeReplace()</code> lets you write a different object in place of this one (the serialization proxy pattern, bonus).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Externalizable</strong> is the manual alternative: you write and read every field yourself in <code>writeExternal</code> and <code>readExternal</code>. Unlike Serializable, Java does call its public no-argument constructor when reading, so that constructor must exist.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "On deserialization, constructors and field initializers of Serializable classes don&#x27;t run; only the first non-serializable superclass&#x27;s no-arg constructor does, so transient fields come back as defaults. I always declare serialVersionUID, because the computed one changes with almost any edit. I validate inside readObject, since no constructor did it."
    }
   ]
  },
  {
   "id": "3.10",
   "title": "Singletons, enums, records, and why serialization is dangerous",
   "blocks": [
    {
     "type": "recall",
     "html": "Deserializing a normal singleton creates a second instance, unless the class has a <code>readResolve()</code> method that returns the existing INSTANCE. An enum is safe automatically, because only its name is written and reading it looks the constant up by name. A record is rebuilt through its canonical constructor, so its validation runs. And you must never deserialize bytes from an untrusted source."
    },
    {
     "type": "p",
     "html": "<strong>Why enums are the safest singleton.</strong> <code>enum Config { INSTANCE; }</code> cannot be duplicated by deserialization (only the name is stored) or by reflection (<code>Constructor.newInstance</code> throws <code>IllegalArgumentException: Cannot reflectively create enum objects</code>). That is why Effective Java recommends a single-element enum for singletons.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Records (Java 16+).</strong> Unlike normal classes, a record is deserialized by calling its canonical constructor with the stored component values, so any checks in a compact constructor (Day 1 card 1.8) run on read too.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why untrusted bytes are dangerous.</strong> While reading, Java creates objects of whatever classes the stream names and calls their <code>readObject</code> methods. An attacker can craft a stream that chains together harmless-looking library classes already on your classpath (a gadget chain) so that reading it ends up running a command. In 2015 a chain through Apache Commons Collections allowed remote code execution on many Java servers.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What to do instead.</strong> For data exchange use JSON (Jackson) or Protobuf, which only create the types you ask for. If you must use Java serialization, install an <code>ObjectInputFilter</code> allow-list of the classes you expect (bonus: JEP 290, <code>java.io.ObjectInputFilter</code> since Java 9, backported to Java 8u121 as <code>sun.misc.ObjectInputFilter</code> and the <code>jdk.serialFilter</code> property; Java 17 added a JVM-wide filter factory, JEP 415).",
     "bullet": true
    },
    {
     "type": "code",
     "code": "class Config implements Serializable {\n    static final Config INSTANCE = new Config();\n    private Config() {}\n    private Object readResolve() { return INSTANCE; }   // throw away the copy that was just read\n}\nenum Settings { INSTANCE }   // safe with no extra code"
    },
    {
     "type": "sayit",
     "html": "A serializable singleton needs readResolve returning INSTANCE, while an enum singleton is safe automatically because only its name is serialized. Records deserialize through their canonical constructor, so validation runs. I never deserialize untrusted data because of gadget-chain attacks; I use JSON or Protobuf, or an ObjectInputFilter allow-list when Java serialization is unavoidable."
    }
   ]
  }
 ],
 "quiz": [
  {
   "q": "What does <code>try { return 1; } finally { return 2; }</code> return, and what else does that pattern break?",
   "a": "It returns 2. A return in finally replaces the pending return value, and it also silently discards any exception that was propagating."
  },
  {
   "q": "<code>int x = 1; try { return x; } finally { x = 2; }</code> returns what? And a StringBuilder that finally appends to?",
   "a": "1, because the value was saved before finally ran. The StringBuilder shows the append, because the saved reference points to the same object."
  },
  {
   "q": "In try-with-resources, the body throws and both close() calls throw. What does the caller catch?",
   "a": "The body&#x27;s exception, with both close exceptions attached as suppressed (getSuppressed())."
  },
  {
   "q": "A <code>@Transactional</code> method writes a debit, then throws a checked exception. Committed or rolled back?",
   "a": "Committed by default. Spring rolls back only on RuntimeException and Error, unless rollbackFor (or the Spring 6.2 global rollbackOn setting) says otherwise."
  },
  {
   "q": "Why can&#x27;t <code>list.forEach(p -&gt; Files.delete(p))</code> compile?",
   "a": "Files.delete throws the checked IOException, and Consumer.accept declares no checked exceptions. Catch inside the lambda and rethrow as UncheckedIOException."
  },
  {
   "q": "After deserialization, what does <code>transient int retries = 3;</code> hold, and why?",
   "a": "0. The = 3 initializer is copied into the constructor, which does not run for a Serializable class on read, and transient fields are not written."
  },
  {
   "q": "Logs show <code>NoClassDefFoundError: Could not initialize class RateTable</code>, but the class is on the classpath. What happened?",
   "a": "Its static initializer failed earlier with ExceptionInInitializerError, and the class is now permanently unusable. Find that first error (on JDK 18+ its message and stack trace are recorded in the cause)."
  },
  {
   "q": "A task scheduled with scheduleAtFixedRate throws once. What happens to the schedule?",
   "a": "All its later runs are suppressed silently; the future completes with the exception, and nothing is logged unless get() is called. Wrap the task body in try/catch and log."
  },
  {
   "q": "You put <code>catch (Exception e)</code> before <code>catch (IOException e)</code>. What happens?",
   "a": "Compile error: the IOException block can never be reached, because Exception already catches it. Order catches from specific to general."
  },
  {
   "q": "Your task catches InterruptedException and just logs it. What breaks?",
   "a": "The blocking call cleared the interrupt flag, so the stop request is lost. shutdownNow() relies on interrupting workers, so the task keeps running. Rethrow it or call Thread.currentThread().interrupt()."
  },
  {
   "q": "<code>try (var in = new GZIPInputStream(new FileInputStream(f)))</code>: what can leak, and how do you fix it?",
   "a": "If the GZIPInputStream constructor throws, the already-open FileInputStream is never closed. Declare each layer as its own resource."
  },
  {
   "q": "A ByteBuffer of capacity 10 has 4 bytes written. What are position and limit after flip()?",
   "a": "Position 0, limit 4, so you can read back exactly the 4 bytes that were written."
  },
  {
   "q": "Does a shutdown hook run on <code>kill -9</code>? On Ctrl-C or Kubernetes stopping a pod?",
   "a": "Not on kill -9 (SIGKILL). Yes on Ctrl-C and on SIGTERM, which is what Kubernetes sends first."
  }
 ]
});
