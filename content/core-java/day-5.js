/* Generated from Core_Java_SDE2_Revision_Day5_v2_dark.pdf by tools/extract_revision_pdf.py */
Revision.addUnit({
 "subject": "core-java",
 "id": "day-5",
 "source": "Core_Java_SDE2_Revision_Day5_v2_dark.pdf",
 "label": "Day 5",
 "title": "JVM Memory, Garbage Collection, Leaks and Class Loading",
 "tagline": "When a JVM runs out of memory, read the OutOfMemoryError message first: it names the memory area that ran out, and that decides which tool you reach for.",
 "topics": "Memory areas · JIT · GC roots · Generational GC · Collectors · References · Leaks and OOM · Tools · Class loading",
 "cards": [
  {
   "id": "5.0",
   "title": "Words this day uses (read once, then skip)",
   "blocks": [
    {
     "type": "recall",
     "html": "A few terms appear on almost every card today. This box gives each one a plain meaning."
    },
    {
     "type": "p",
     "html": "<strong>Garbage collector (GC).</strong> The part of the JVM that finds objects your program can no longer use and frees their memory automatically.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Stop-the-world (STW) pause.</strong> A moment when the GC freezes all your application threads so it can work safely. Pause length is what users feel as latency spikes.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Live set.</strong> The total size of objects that are still in use (reachable) at a given moment. Garbage is everything else.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Allocation rate.</strong> How many megabytes of new objects your program creates per second. A high rate means more frequent young collections.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Native memory.</strong> Memory the JVM process uses outside the Java heap (thread stacks, class metadata, compiled code, direct buffers). The operating system counts it; <code>-Xmx</code> does not limit it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>RSS (resident set size).</strong> The real amount of RAM a process uses, as the operating system (and Kubernetes) sees it: heap plus all native memory.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Heap dump and thread dump.</strong> A heap dump is a file containing every object on the heap at one moment (for finding what holds memory). A thread dump is a text listing of every thread and what it is doing (for finding stuck threads).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The kinds of collection.</strong> A young collection cleans only the young generation (new objects). An old collection works on the old generation (long-lived objects). G1 also does mixed collections: a young collection plus some old regions. A full collection cleans the entire heap in one long stop-the-world pause; it is the expensive last resort. (Card 5.4 explains young and old.)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Marking.</strong> The phase where the GC walks every reference from the GC roots (card 5.3) and ticks each object it reaches as live. Whatever is not ticked is garbage. Concurrent marking means doing this walk while your code keeps running.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Survivor space and region.</strong> Survivor spaces are two small areas in the young generation where objects that survived a young collection wait (card 5.4). A region is one of the equal-sized blocks (typically 1 to 32 MB) that G1 splits the whole heap into (card 5.5).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Direct buffer.</strong> A buffer of bytes allocated outside the heap, so the operating system can read and write it for network or file I/O without an extra copy (Day 3 card 3.8). Netty, the networking library under Spring WebFlux, WebClient and many Kafka/gRPC clients, uses lots of them.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Native thread.</strong> The operating-system thread underneath. Every ordinary (platform) Java thread is one native thread.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>JEP.</strong> JDK Enhancement Proposal: the numbered proposals by which new Java features are added. Quoting the number is optional.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bonus vocabulary</strong> is marked (bonus): names to recognise if an interviewer says them. Card 5.10 is entirely bonus: just read it, no cover-and-recall.",
     "bullet": true
    }
   ]
  },
  {
   "id": "5.1",
   "title": "The JVM's memory areas, and why -Xmx is not the size of the process",
   "blocks": [
    {
     "type": "recall",
     "html": "The heap holds every object and array, including the String pool and the values of static fields. (For <code>static int count = 5;</code> the field&#x27;s description, its name and type, is class metadata in Metaspace, but the value 5 lives on the heap inside the class&#x27;s <code>java.lang.Class</code> object, the object you get from <code>Foo.class</code>.) Each thread has its own stack, made of one frame per method call that is running, holding that call&#x27;s local variables and parameters. Metaspace, which lives in native memory, holds class metadata (the class&#x27;s structure, methods and bytecode); it replaced PermGen in Java 8. Beyond those, the process also uses the code cache (JIT-compiled machine code), direct buffers and the GC&#x27;s own bookkeeping."
    },
    {
     "type": "p",
     "html": "<strong>Where <code>Order o = new Order();</code> lives.</strong> The reference <code>o</code> is a local variable, so it sits in the current method&#x27;s frame on the thread&#x27;s stack. The Order object itself is on the heap. A primitive local such as <code>int count</code> sits directly in the frame, with no object at all.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The sizing flags.</strong> <code>-Xmx</code> is the maximum heap size and <code>-Xms</code> the starting heap size; they control only the heap. <code>-Xss</code> sets the stack size of each thread (typically 1 MB on 64-bit Linux). A <code>StackOverflowError</code> means a thread&#x27;s stack ran out, almost always because of deep or unbounded recursion; fix the recursion rather than raising <code>-Xss</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why a 4 GB heap gives a 5–7 GB process.</strong> On top of the heap come every thread&#x27;s stack (500 threads × up to 1 MB reserved each; the memory really used is usually much less, so measure it), Metaspace, the code cache, direct buffers (Netty uses a lot), and the GC&#x27;s data structures. Measure the real non-heap usage with Native Memory Tracking (card 5.8), then size the container as heap + measured non-heap + headroom.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>No <code>-Xmx</code> in a container.</strong> The JVM then sets the maximum heap to 25% of the container&#x27;s memory limit (the default <code>MaxRAMPercentage</code>), which wastes most of the pod. Set <code>-XX:MaxRAMPercentage=75</code> or an explicit <code>-Xmx</code>.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Objects live on the heap, each thread&#x27;s stack holds frames with its locals and references, and class metadata lives in native Metaspace. -Xmx caps only the heap; thread stacks, Metaspace, the code cache and direct buffers come on top, which is why a pod can be OOMKilled while the heap looks healthy."
    }
   ]
  },
  {
   "id": "5.2",
   "title": "The JIT compiler and warm-up",
   "blocks": [
    {
     "type": "recall",
     "html": "The JVM first interprets your bytecode, one instruction at a time, while counting which methods and loops run often. Hot code is compiled to machine code by the C1 compiler (quick to compile, lightly optimized), and the hottest code is later recompiled by C2 (slow to compile, heavily optimized). This is why a Java service is slower for its first minutes after start-up: it is still warming up."
    },
    {
     "type": "p",
     "html": "<strong>What C2 does, in plain words.</strong> Inlining: it copies the body of a small method into its caller, removing the call. Escape analysis: if an object never leaves the method, C2 can skip creating it on the heap at all and treat its fields as plain local variables; that trick is called scalar replacement. Lock elision: it removes <code>synchronized</code> on an object that no other thread can ever see.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Speculation and deoptimization.</strong> C2 optimizes for what it has seen so far (for example, &quot;this interface call always goes to one class&quot;, so it can call that one method directly, or inline it, without looking up which implementation to run). If that assumption later breaks, the JVM throws away the compiled code and goes back to the interpreter (deoptimization), then recompiles.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Practical consequences.</strong> Send warm-up traffic before putting a new pod into the load balancer. Never measure performance with a hand-written loop and <code>System.currentTimeMillis()</code>; use JMH (the Java Microbenchmark Harness), which handles warm-up and stops the JIT from optimizing your test away (if a loop&#x27;s result is never used, the JIT may simply delete the loop, and your benchmark measures nothing).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Code starts interpreted, gets compiled by C1 when it&#x27;s warm and by C2 when it&#x27;s hot, with inlining, escape analysis and lock elision based on runtime profiling, and deoptimizes if an assumption breaks. That explains warm-up, so I benchmark with JMH and warm pods before they take traffic."
    }
   ]
  },
  {
   "id": "5.3",
   "title": "GC roots and reachability: what the GC keeps",
   "blocks": [
    {
     "type": "recall",
     "html": "The GC keeps every object that can be reached by following references from a GC root, and treats everything else as garbage, including groups of objects that only reference each other in a cycle. GC roots are the starting points the JVM always treats as alive: the local variables of every running thread&#x27;s stack, static fields of loaded classes, objects used as locks right now (held monitors), and references held by native code (JNI)."
    },
    {
     "type": "p",
     "html": "<strong>What a Java memory leak really is.</strong> Not &quot;the GC missed an object&quot;. It is an object you no longer need that is still reachable from a root, usually because some long-lived collection, often a static map, still holds a reference to it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Setting a variable to null</strong> removes only that one path. The object becomes garbage only when no path from any root reaches it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Cycles are not a problem.</strong> If A references B and B references A, but nothing from a root reaches either one, both are collected. Tracing from roots handles this naturally; pure reference counting (counting how many references point at each object, as Python does on its own) cannot.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "The GC keeps whatever is reachable from GC roots, which are thread stacks, static fields, held monitors and JNI references, and reclaims the rest, cycles included. So a Java leak is an unwanted object that&#x27;s still reachable, typically through a static collection or a cache without eviction."
    }
   ]
  },
  {
   "id": "5.4",
   "title": "Generational garbage collection",
   "blocks": [
    {
     "type": "recall",
     "html": "Most objects die young (a request&#x27;s DTOs, temporary strings), so the heap is split into a young generation and an old generation. New objects are created in Eden, part of the young generation. A young collection copies the still-live objects from Eden and from one survivor space into the other, empty survivor space, adding 1 to each object&#x27;s age, and then frees the whole of Eden and the first survivor space in one step. Objects that survive enough young collections (an age the JVM adjusts, at most 15) are promoted (moved) to the old generation."
    },
    {
     "type": "p",
     "html": "<strong>One young collection, step by step.</strong> Before: Eden holds A, B and C; survivor space S0 holds D; S1 is empty. A and D are still referenced, B and C are garbage. (1) The GC copies A and D into S1, and their age goes up by 1. (2) It frees all of Eden and S0 at once, without looking at B or C. (3) For the next young collection the roles swap: S1 is the full one, S0 the empty target. When an object&#x27;s age passes the threshold, it is copied to the old generation instead of to a survivor space.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why a young collection is cheap even with a 1 GB Eden.</strong> Its cost depends on how many objects survive, because it only copies live objects. Dead objects are never visited; their memory is reclaimed all at once.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why two survivor spaces.</strong> The collector needs an empty space to copy live objects into. After each young collection the two survivor spaces swap roles: the one just filled becomes &quot;from&quot;, and the one just emptied becomes &quot;to&quot; for the next collection.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Premature promotion.</strong> Objects that live a little too long (medium-lived, such as a big batch held for seconds) survive enough young collections to be promoted, and then die in the old generation. The old generation fills with garbage, causing frequent and expensive old collections. Fix it by giving the young generation and survivors more room so those objects die before promotion (with G1: a larger heap or a looser pause goal), or by shortening how long the code holds them.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Reading a GC log line.</strong> <code>Pause Young (Normal) 1843M-&gt;412M(4096M) 11.4ms</code> means: a young collection (Normal means an ordinary one; other labels mark special ones, such as the young collection that also starts concurrent marking); heap used went from 1843 MB before to 412 MB after; the heap&#x27;s currently allocated size is 4096 MB (this can be below -Xmx); the pause took 11.4 ms.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Very large objects.</strong> In G1 (card 5.5), an object of half a region or more is a humongous object and goes straight into special old-generation regions, skipping Eden.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Allocation is cheap (bonus: TLAB).</strong> Each thread gets its own chunk of Eden, a thread-local allocation buffer, so creating an object usually just bumps a pointer, with no locking.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Most objects die young, so new objects go to Eden, and a young GC copies only the survivors into a survivor space and frees the rest at once, so its cost depends on survivors, not garbage. Objects that survive enough cycles are promoted to the old generation, and medium-lived objects that get promoted and then die cause expensive old collections."
    }
   ]
  },
  {
   "id": "5.5",
   "title": "The collectors and their trade-offs",
   "blocks": [
    {
     "type": "recall",
     "html": "Every collector trades between throughput (how much CPU time goes to your code rather than to GC), latency (how long the pauses are) and footprint (how much memory it needs); you choose which to sacrifice. Serial suits tiny heaps. Parallel maximizes throughput but stops the world for long pauses. G1, the default since Java 9 when the JVM sees at least 2 CPUs and about 1.8 GB of memory (otherwise it picks Serial, which is common in small pods), splits the heap into regions, marks the old generation while your code runs, and aims for a pause goal (200 ms by default). ZGC keeps pauses under a millisecond; generational ZGC arrived in Java 21 as an option, became the default in Java 23, and is the only mode since Java 24."
    },
    {
     "type": "p",
     "html": "<strong>Parallel versus concurrent: two different words.</strong> A parallel collector uses many GC threads at once, but may still stop your application while it works. A concurrent collector does its work while your application threads keep running.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Concurrent does not mean free.</strong> ZGC spends extra CPU on barriers (small checks added when references are read and written), needs spare heap headroom, otherwise threads stall waiting for memory (allocation stalls), and cannot use compressed oops, the 4-byte references explained in card 5.10.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>G1 tuning rules.</strong> Set the heap size and, if needed, the pause goal (<code>-XX:MaxGCPauseMillis</code>). Do not fix the young generation size with <code>-Xmn</code>, because G1 resizes it to meet the pause goal. Never call <code>System.gc()</code> in application code; it requests a full collection (card 5.0).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>How to choose.</strong> Start with G1. Measure allocation rate, live set and pause percentiles in GC logs. Move to ZGC only if GC pauses are what is hurting your p99 latency, and accept the extra CPU and memory.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "It&#x27;s a trade-off between throughput, latency and footprint. I start with G1, which is region-based with concurrent old marking and a pause-time goal, measure allocation rate, live set and pause percentiles, and switch to generational ZGC only if GC pauses dominate p99, accepting more CPU and headroom."
    }
   ]
  },
  {
   "id": "5.6",
   "title": "Weak, soft and phantom references",
   "blocks": [
    {
     "type": "recall",
     "html": "Normal references are strong: an object reachable through one is never collected. <code>java.lang.ref</code> offers three weaker kinds. A WeakReference does not keep its object alive: the next GC that finds the object reachable only through weak references clears the reference (its <code>get()</code> now returns null), and the object itself becomes garbage. A SoftReference is kept until the GC decides to clear it: HotSpot clears ones that have not been used recently (based on how much heap is free), and clears all of them before it would throw OutOfMemoryError. A PhantomReference never gives the object back; it only tells you, through a ReferenceQueue that you pass in when you create it, that the object is no longer reachable and its memory can be reclaimed, so you can clean up."
    },
    {
     "type": "p",
     "html": "<strong>WeakHashMap, with an example.</strong> Its keys are held weakly, its values strongly. If you map <code>session → sessionMetadata</code> and the session object is no longer used anywhere else, the next GC clears that key and the entry disappears. Use it to attach extra data to objects you do not own.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The WeakHashMap trap.</strong> Because values are strong, a value that refers back to its own key (for example metadata holding a field pointing at the session) keeps the key reachable, so the entry is never removed and you have a leak.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why SoftReference makes a poor cache.</strong> The GC, not you, decides what to drop and when, typically all at once under memory pressure, right when the system is busiest. Use a real cache with a size limit and eviction (Caffeine).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>PhantomReference and Cleaner.</strong> <code>java.lang.ref.Cleaner</code> (Java 9) is built on phantom references and is the modern replacement for <code>finalize()</code> (Day 3), which is deprecated for removal.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Weak references are cleared by the next GC that finds the object only weakly reachable, which is what WeakHashMap keys rely on, though a value pointing back at its key leaks. Soft references are cleared under memory pressure, so I prefer a bounded cache like Caffeine. Phantom references, through Cleaner, replace finalize for cleanup."
    }
   ]
  },
  {
   "id": "5.7",
   "title": "Memory leaks and the OutOfMemoryError messages",
   "blocks": [
    {
     "type": "recall",
     "html": "Every leak has the same shape: a GC root, then a long-lived holder, then objects that should have died. Typical holders are static maps, caches without eviction, listeners that are registered but never removed, ThreadLocals on pooled threads (Day 4A), unbounded executor queues, and class loaders kept alive after redeploying an application inside the same running JVM (card 5.9). The signature on a graph: the heap floor, meaning heap used right after each old or full collection, keeps rising over hours."
    },
    {
     "type": "p",
     "html": "<strong>Normal versus leaking.</strong> A healthy heap graph is a sawtooth: usage climbs as objects are created, then drops after each collection, to about the same floor every time. A leak shows the floor itself creeping upward.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Production JVM flags.</strong> <code>-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps</code> writes a heap dump when the heap runs out. <code>-XX:+ExitOnOutOfMemoryError</code> makes the JVM exit, so Kubernetes restarts a clean pod instead of leaving a half-broken one running. <code>-Xlog:gc*</code> with file rotation keeps GC logs.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Interned strings.</strong> Calling <code>String.intern()</code> on unique values, such as request ids, adds work to the string table (the JVM&#x27;s String pool) for no benefit; interned strings are collected once unreachable, so it only becomes a leak if you also keep them. <code>-XX:+UseStringDeduplication</code> is a different thing: the GC makes equal Strings share one backing array (the internal byte array that holds a String&#x27;s characters), saving memory without changing your code.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>OutOfMemoryError message</strong>",
      "<strong>What ran out</strong>",
      "<strong>What to do</strong>"
     ],
     "rows": [
      [
       "<code>Java heap space</code>",
       "The heap",
       "Heap dump, then analyse it in Eclipse MAT (card 5.8)."
      ],
      [
       "<code>GC overhead limit exceeded</code>",
       "The heap, almost: the GC is running nearly all the time and freeing almost nothing (mainly with Parallel GC)",
       "Same as above."
      ],
      [
       "<code>Metaspace</code>",
       "Class metadata",
       "A class-loader leak after redeploys, or code that keeps generating new classes (card 5.9)."
      ],
      [
       "<code>Cannot reserve ... direct buffer memory</code>",
       "Direct buffers (Day 3 card 3.8)",
       "Native Memory Tracking; check Netty or NIO buffer usage."
      ],
      [
       "<code>unable to create native thread</code>",
       "OS threads",
       "A thread leak, often an unbounded cached pool (Day 4B). Take a thread dump and look at thread names."
      ]
     ]
    },
    {
     "type": "trap",
     "html": "<strong>OOMKilled (exit code 137) is not a Java OutOfMemoryError.</strong> The Linux kernel killed the whole process with SIGKILL (137 = 128 + 9) because its total RSS went over the container&#x27;s memory limit, very often because of non-heap memory. The JVM gets no chance to react, so no heap dump is written and no Java error is logged. Investigate with Native Memory Tracking, not a heap dump."
    },
    {
     "type": "sayit",
     "html": "A leak is a root holding a long-lived container of objects that should have died, and its signature is a rising floor after old collections. I read the OutOfMemoryError message to know which area ran out. An OOMKilled pod with exit code 137 is the kernel enforcing the container limit, usually because of non-heap memory, so I use Native Memory Tracking there."
    }
   ]
  },
  {
   "id": "5.8",
   "title": "The diagnosis toolkit: from symptom to tool",
   "blocks": [
    {
     "type": "recall",
     "html": "Go from the symptom to the evidence, then to the tool. A rising heap floor: take a heap dump and open it in Eclipse MAT (Memory Analyzer), looking at the dominator tree, retained sizes and the path to GC roots. Long GC pauses: GC logs plus JFR (Java Flight Recorder). Process RSS far above <code>-Xmx</code>: Native Memory Tracking. Too many threads or stuck threads: a thread dump."
    },
    {
     "type": "p",
     "html": "<strong><code>jcmd &lt;pid&gt;</code> does nearly everything.</strong> <code>GC.heap_info</code> (heap summary), <code>GC.class_histogram</code> (object counts per class, a quick first look), <code>GC.heap_dump /tmp/h.hprof</code> (full heap dump), <code>Thread.print</code> (thread dump), <code>summary</code> (needs the JVM started with <code>VM.native_memory -XX:NativeMemoryTracking=summary</code>; it cannot be switched on later, so add the flag before the problem happens; its overhead is small), and <code>JFR.start</code> (start a flight recording).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Dominator tree.</strong> MAT&#x27;s view that shows, for each object, which objects are kept alive only through it. The top entries are the biggest memory holders, so it is usually the first screen to open when hunting a leak.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Shallow versus retained size.</strong> Shallow size is the memory of the object itself. Retained size is everything that would be freed if that object were removed, because only it keeps those objects alive. A HashMap object is tiny (shallow), but it can retain 2 GB of entries. In MAT, sort by retained size, then follow the path to GC roots to see who holds it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Cautions with heap dumps.</strong> A heap dump shows only the heap, not native memory. Taking one pauses the JVM (seconds for a large heap). And it contains every value in memory, including customers&#x27; personal data and secrets, so handle the file like production data.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>JFR (bonus detail).</strong> Java Flight Recorder records allocation, locks, GC, I/O and CPU hotspots with low overhead, so it is safe to run in production; open the recording in JDK Mission Control.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "I go from symptom to tool: a rising floor means a heap dump in MAT, looking at retained size and the path to GC roots; long pauses mean GC logs and JFR; RSS well above Xmx means Native Memory Tracking; thread problems mean a thread dump. jcmd covers all of these. Heap dumps pause the JVM and contain sensitive data."
    }
   ]
  },
  {
   "id": "5.9",
   "title": "Class loading",
   "blocks": [
    {
     "type": "recall",
     "html": "Classes are loaded by a chain of class loaders: Bootstrap (the JDK&#x27;s core classes; it is built into the JVM in native code rather than being a Java object, so <code>String.class.getClassLoader()</code> returns null), then Platform, then Application (your classpath), then any custom loaders. Loading follows parent-first delegation: a loader first asks its parent, and only looks for the class itself if the parent cannot find it. That is why your jar cannot replace <code>java.lang.String</code>, and why the whole JVM shares one <code>Object</code> class."
    },
    {
     "type": "p",
     "html": "<strong>Loading is not initializing.</strong> Loading reads the class into memory; initializing runs its static field initializers and <code>static { }</code> blocks, exactly once, under a lock (which is why the holder idiom from Day 4A is safe). A class is initialized on first <code>new</code>, first call of a static method, first use of a static field that is not a compile-time constant, <code>Class.forName(name)</code>, or when a subclass is initialized.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What does not initialize a class.</strong> Writing <code>Foo.class</code>. Reading a compile-time constant such as <code>static final int MAX = 10</code>, because the compiler copies the value 10 into your code (Day 1 card 1.5). Creating an array <code>new Foo[5]</code>. And <code>ClassLoader.loadClass(name)</code>, which loads without initializing.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>ClassNotFoundException vs NoClassDefFoundError.</strong> ClassNotFoundException is checked and is thrown when code asks for a class by name (<code>Class.forName</code>) and no loader finds it: a missing jar or a wrong name. NoClassDefFoundError means the class was there when your code was compiled but cannot be used at run time: either it is missing from the runtime classpath, or its static initializer failed earlier (that first failure was an ExceptionInInitializerError, Day 3 card 3.6).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>&quot;Order cannot be cast to Order&quot;.</strong> At run time a class&#x27;s identity is its name plus the class loader that defined it. Two loaders that each load <code>Order</code> produce two different types, so casting one to the other fails. You see this in app servers (each Tomcat web app has its own loader), plugin systems, and with Spring DevTools&#x27; restart class loader.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Class-loader leaks</strong> happen only when an application is redeployed inside the same running JVM: a WAR redeployed into a running Tomcat, or Spring DevTools restarting your app. On Kubernetes, a normal deploy starts a fresh JVM in a new pod, so this leak cannot carry over. After such an in-place redeploy, the old application&#x27;s class loader should be garbage-collected together with every class it loaded. One leftover reference from outside (a thread the app started and never stopped, a JDBC driver registered with DriverManager, a ThreadLocal value on a server thread) keeps the whole old loader alive, and after several redeploys Metaspace runs out. Related: Tomcat loads a web app&#x27;s own classes child-first, the opposite of normal delegation, so the app can use its own library versions; core <code>java.*</code> classes are always taken from the parent, so a web app still cannot replace String.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Class loaders delegate to their parent first, which protects core classes and keeps one copy of them. Loading isn&#x27;t initializing: static initialization runs once, on first active use, not on Foo.class or compile-time constants. ClassNotFoundException is a failed load by name; NoClassDefFoundError means a class missing at runtime or a failed static initializer. Class identity is name plus loader, so the same class from two loaders can&#x27;t be cast."
    }
   ]
  },
  {
   "id": "5.10",
   "title": "Also worth knowing (bonus, for follow-up questions)",
   "blocks": [
    {
     "type": "recall",
     "html": "These rarely come up as a first question, but an interviewer may follow up on them. Know one sentence about each."
    },
    {
     "type": "p",
     "html": "<strong>Object header and layout.</strong> Every object starts with a header: on 64-bit JVMs typically 12 bytes (an 8-byte mark word holding the hash code, lock state and GC age, plus a 4-byte pointer to its class), and objects are padded to a multiple of 8 bytes. So even <code>new Object()</code> takes 16 bytes. Java 25 made compact 8-byte headers an option (JEP 519).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Compressed oops</strong> (oop = ordinary object pointer, a reference). On heaps up to about 32 GB, the JVM stores references in 4 bytes instead of 8. Because objects always start on an 8-byte boundary, the 4-byte value counts in 8-byte steps: 4 billion steps × 8 bytes = 32 GB. Crossing roughly 32 GB switches to 8-byte references, so a 33 GB heap can hold less data than a 31 GB one.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Card tables and remembered sets.</strong> To collect the young generation without scanning the whole old generation, the JVM records which old-generation areas contain references into the young generation, and a young GC scans only those. A card table divides the old generation into small cards (512 bytes) and marks a card dirty when a reference into the young generation is written there. G1 additionally keeps, per region, a remembered set listing the cards elsewhere that point into that region.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Safepoints.</strong> A stop-the-world pause can begin only when every thread reaches a safepoint, a place in the code where the JVM can safely inspect it. A long-running loop with no safepoint check can delay everyone (visible as time spent reaching the safepoint in <code>-Xlog:safepoint</code> output).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Container flags.</strong> <code>-XX:MaxRAMPercentage</code> sets the heap as a share of the container limit, and <code>-XX:ActiveProcessorCount</code> overrides the CPU count the JVM detects.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Faster start-up.</strong> CDS (class data sharing) stores pre-parsed classes in an archive reused across starts. Project Leyden adds an ahead-of-time cache (Java 24+): work such as class loading and linking done in a training run before production is saved and reused at start-up. GraalVM native image compiles the whole application to a native executable that starts in milliseconds, at the cost of build time and restrictions on reflection.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The thread context class loader.</strong> Frameworks such as JDBC&#x27;s DriverManager (through <code>java.util.ServiceLoader</code>) or Spring sometimes need to load your application&#x27;s classes from code that lives in a parent loader; they use <code>Thread.currentThread().getContextClassLoader()</code> to reach the application loader.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Hidden classes (Java 15).</strong> Classes created at run time that cannot be found by name; the JVM uses them for lambdas. They live in Metaspace like any other class.",
     "bullet": true
    }
   ]
  }
 ],
 "quiz": [
  {
   "q": "A pod with -Xmx4g and an 8 GB limit is OOMKilled while the heap graph shows 2.5 GB. Where is the memory, and which tool do you use?",
   "a": "Outside the heap: thread stacks, Metaspace, code cache, direct buffers, GC structures. Use Native Memory Tracking (jcmd VM.native_memory). A heap dump won&#x27;t show it."
  },
  {
   "q": "You start a JVM in a 4 GB container with no -Xmx. How big can the heap get?",
   "a": "About 1 GB: the default MaxRAMPercentage is 25% of the container limit. Set MaxRAMPercentage (for example 75) or -Xmx."
  },
  {
   "q": "Why is a young collection cheap even when Eden is 1 GB?",
   "a": "It copies only the live objects out and frees the whole area at once; dead objects are never visited."
  },
  {
   "q": "What is the difference between a parallel and a concurrent collector?",
   "a": "Parallel uses many GC threads but may still stop the application; concurrent does its work while application threads keep running."
  },
  {
   "q": "A value in a WeakHashMap holds a reference to its own key. What happens?",
   "a": "The strong value keeps the key reachable, so the entry is never removed: a leak."
  },
  {
   "q": "Does reading <code>Config.MAX</code> (<code>static final int MAX = 10</code>) run Config&#x27;s static block?",
   "a": "No. It&#x27;s a compile-time constant copied into the caller by javac, so Config is never initialized."
  },
  {
   "q": "How do you tell a real leak from normal sawtooth heap usage?",
   "a": "Watch the floor: heap used right after each old or full collection. A floor that keeps rising over hours means objects are being retained."
  },
  {
   "q": "A pod restarts with exit code 137 and there is no heap dump. Why not?",
   "a": "The kernel killed the process (SIGKILL) for exceeding the container memory limit; the JVM never saw a Java OutOfMemoryError, so it wrote nothing."
  },
  {
   "q": "In MAT, a HashMap shows a shallow size of 48 bytes and a retained size of 2 GB. What does that mean?",
   "a": "The map object itself is tiny, but 2 GB of objects are kept alive only through it; removing it would free 2 GB."
  },
  {
   "q": "What does &quot;Order cannot be cast to Order&quot; tell you?",
   "a": "Two class loaders each loaded Order; class identity is name plus defining loader, so they&#x27;re different types."
  }
 ]
});
