/* Generated from Core_Java_SDE2_Revision_Day4A_v2_dark.pdf by tools/extract_revision_pdf.py */
Revision.addUnit({
 "subject": "core-java",
 "id": "day-4a",
 "source": "Core_Java_SDE2_Revision_Day4A_v2_dark.pdf",
 "label": "Day 4A",
 "title": "Threads, the Memory Model, Locks and Atomics",
 "tagline": "Every concurrency bug is one of three things: a thread does not see another's write (visibility), an update gets lost halfway (atomicity), or writes appear in the wrong order (ordering). Name which one.",
 "topics": "Threads · Interruption · Memory model · volatile · synchronized · wait/notify · Locks · Deadlock · CAS · ThreadLocal",
 "cards": [
  {
   "id": "4.0",
   "title": "Words this day uses (read once, then skip)",
   "blocks": [
    {
     "type": "recall",
     "html": "Concurrency has its own vocabulary. This box gives each word one plain meaning so the cards below read smoothly."
    },
    {
     "type": "p",
     "html": "<strong>Thread.</strong> An independent path of execution inside your program. Each thread runs its own sequence of method calls, but all threads in the JVM share the same heap (the same objects).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>CPU core and scheduler.</strong> A core runs one thread at a time. The operating system&#x27;s scheduler switches threads on and off the cores many times a second, so a thread can be paused at any instruction, even in the middle of <code>count++</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Shared mutable state.</strong> An object field that more than one thread reads and at least one thread writes. Every concurrency problem below needs this. Immutable data, and thread-confined data (data only one thread ever touches, such as a local variable inside a method), is automatically safe.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Monitor.</strong> The lock that every Java object carries. <code>synchronized (obj)</code> takes <code>obj</code>&#x27;s monitor; only one thread can hold a given monitor at a time.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Blocking.</strong> A thread is blocked when it cannot continue until something happens: a lock becomes free, an item arrives in a queue, a sleep ends. A blocked thread uses no CPU. Careful: this everyday word &quot;blocked&quot; is wider than the thread state named BLOCKED in card 4.1, which only means waiting for a synchronized monitor.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Park.</strong> The JVM&#x27;s low-level way to put a thread to sleep until something wakes it (<code>LockSupport.park()</code> and <code>unpark()</code>). ReentrantLock, BlockingQueue and virtual threads are all built on it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Spin.</strong> To retry in a tight loop instead of going to sleep; it burns CPU while waiting.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Reordering and CPU caches.</strong> To run faster, the compiler, the JIT (the part of the JVM that compiles frequently run code into machine code while the program runs) and the CPU may execute your writes in a different order than you wrote them, and each core keeps recent values in its own cache. Inside one thread you can never notice this. Another thread can.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Java Memory Model (JMM).</strong> The rulebook in the Java spec that says when a write made by one thread is guaranteed to be visible to another thread. Its central rule is happens-before (card 4.3). Each rule that creates a happens-before link is called an edge.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Publish.</strong> To make an object reachable by other threads, for example by storing it in a shared field. Safe publication means doing it so that other threads are guaranteed to see the object fully built.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Data race.</strong> Two threads access the same variable, at least one of them writes, and nothing orders the two accesses. The result is then not guaranteed.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Contention.</strong> Many threads trying to take the same lock or update the same variable at the same moment, so most of them have to wait or retry.",
     "bullet": true
    }
   ]
  },
  {
   "id": "4.1",
   "title": "Threads, Runnable and Callable, and the six thread states",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>thread.start()</code> asks the JVM to create a new thread, and that new thread then calls <code>run()</code>. If you call <code>run()</code> yourself, it is just a normal method call on your current thread, and nothing runs in parallel. Calling <code>start()</code> a second time on the same Thread throws <code>IllegalThreadStateException</code>."
    },
    {
     "type": "p",
     "html": "<strong>Process vs thread.</strong> A process (your JVM) has its own memory. Threads inside it share the heap, but each thread has its own stack (its chain of method calls and local variables) and its own program counter (where it is in the code).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Platform vs virtual threads.</strong> A platform thread is a thin wrapper around one operating-system thread, which is expensive (about 1 MB of stack and kernel bookkeeping), so you can have thousands. A virtual thread (Java 21) is scheduled by the JVM onto a small pool of platform threads; when it blocks on I/O, the JVM parks it (card 4.0) and frees the platform thread, so you can have millions.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Runnable vs Callable.</strong> <code>Runnable.run()</code> returns nothing and cannot throw a checked exception. <code>Callable.call()</code> returns a value and may throw any exception. A <code>FutureTask</code> can wrap either and gives you a Future to collect the result.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Daemon threads.</strong> A daemon thread is a background helper. The JVM exits when only daemon threads remain, without waiting for them (and their <code>finally</code> blocks may not run). Call <code>setDaemon(true)</code> before <code>start()</code>.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>State</strong>",
      "<strong>What it means</strong>"
     ],
     "rows": [
      [
       "NEW",
       "Created, <code>start()</code> not called yet."
      ],
      [
       "RUNNABLE",
       "Running, or ready to run and waiting for a CPU core. A thread blocked inside socket or file I/O also shows as RUNNABLE."
      ],
      [
       "BLOCKED",
       "Waiting to enter a <code>synchronized</code> block, or to get it back after being woken from <code>wait()</code> (before <code>wait()</code> can return), because another thread holds the monitor."
      ],
      [
       "WAITING",
       "Waiting with no time limit: <code>wait()</code>, <code>join()</code>, <code>LockSupport.park()</code>. A thread waiting for a ReentrantLock (card 4.7) is also WAITING, not BLOCKED: synchronized is handled by the JVM itself and shows as BLOCKED, while ReentrantLock is ordinary Java code that parks the thread."
      ],
      [
       "TIMED_WAITING",
       "The same with a time limit: <code>sleep(ms)</code>, <code>wait(ms)</code>, <code>join(ms)</code>, a timed park."
      ],
      [
       "TERMINATED",
       "<code>run()</code> finished, normally or by an exception."
      ]
     ]
    },
    {
     "type": "trap",
     "html": "<code>Thread.sleep()</code> keeps every lock the thread holds, so other threads stay blocked while it sleeps. <code>obj.wait()</code> releases <code>obj</code>&#x27;s monitor while waiting (and you must hold that monitor to call it). Interviewers love asking this difference."
    },
    {
     "type": "sayit",
     "html": "start creates a new thread that runs run; calling run directly just executes it on the current thread. Threads share the heap but each has its own stack. The six states are NEW, RUNNABLE, BLOCKED for monitor entry, WAITING and TIMED_WAITING for wait, join, park and sleep, and TERMINATED. sleep keeps locks; wait releases the monitor."
    }
   ]
  },
  {
   "id": "4.2",
   "title": "Interruption: how you ask a thread to stop",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>thread.interrupt()</code> does not stop anything by force. It only sets a boolean flag on the target thread, the interrupt flag. Blocking methods such as <code>sleep</code>, <code>wait</code>, <code>join</code>, <code>BlockingQueue.take</code> and <code>lockInterruptibly</code> (card 4.7) check that flag: they throw <code>InterruptedException</code>, and they clear the flag at the same moment they throw."
    },
    {
     "type": "p",
     "html": "<strong>Two ways to read the flag.</strong> <code>Thread.interrupted()</code> is a static method that reads the current thread&#x27;s flag and also clears it. <code>thread.isInterrupted()</code> only reads it. Mixing them up loses the stop request.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Handling InterruptedException correctly.</strong> Either let it propagate (declare <code>throws InterruptedException</code>), or restore the flag with <code>Thread.currentThread().interrupt()</code> and then stop what you were doing. Never catch it and continue as if nothing happened (Day 3 card 3.5 shows how that breaks <code>shutdownNow()</code>).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>If the thread is not blocked when interrupted,</strong> the flag simply stays set. The next blocking call it makes throws immediately.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Code that never blocks must check for itself.</strong> A loop doing pure CPU work never calls a blocking method, so nothing throws. Check <code>while (!Thread.currentThread().isInterrupted()) { ... }</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What interruption cannot stop.</strong> A thread waiting to enter a <code>synchronized</code> block, or waiting in ReentrantLock&#x27;s plain <code>lock()</code> (card 4.7), ignores interrupts. Classic <code>java.io</code> socket reads on a platform thread ignore them too (NIO channels do respond, by closing the channel; and on a virtual thread, Java 21+, the socket is closed and a <code>SocketException</code> is thrown).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Interruption is cooperative: interrupt sets a flag, and blocking methods respond by throwing InterruptedException and clearing the flag. I either propagate it or restore the flag with Thread.currentThread().interrupt() before stopping, and CPU-bound loops poll isInterrupted. Monitor entry and plain lock() are not interruptible."
    }
   ]
  },
  {
   "id": "4.3",
   "title": "Visibility, atomicity and ordering; the happens-before rule",
   "blocks": [
    {
     "type": "recall",
     "html": "If nothing orders a write in one thread before a read in another, the reader may see an old value, a half-finished update, or several writes in a different order than they were made. The Java Memory Model&#x27;s guarantee is called happens-before: if action A happens-before action B, then B is guaranteed to see A&#x27;s effects (and everything before A). A write and a read of shared data with no happens-before between them is a data race."
    },
    {
     "type": "p",
     "html": "<strong>Visibility failure.</strong> Thread A sets <code>running = false</code>, but Thread B&#x27;s loop <code>while (running) {}</code> never stops, because B keeps using its own stale copy (the JIT may even hoist the read out of the loop: read <code>running</code> once before the loop and never again).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Atomicity failure.</strong> <code>count++</code> is really three steps: read count, add 1, write count. Two threads can both read 5 and both write 6, so one increment is lost.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Ordering failure.</strong> Thread A runs <code>data = 42; ready = true;</code>. Thread B sees <code>ready == true</code> but <code>data == 0</code>, because the two writes became visible in the opposite order.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Happens-before is transitive.</strong> If A happens-before B and B happens-before C, then A happens-before C. That is how one volatile write can safely publish many ordinary writes made before it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Safe publication is not thread safety.</strong> Publishing an object safely (card 4.0; through one of the edges in the table below) guarantees other threads see it fully built. It does not make later changes to that object safe; those need their own synchronization.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>CPU caches are only a picture.</strong> &quot;Each core has its own cache&quot; helps intuition, but the real rule you reason with in an interview is happens-before.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>Happens-before edge</strong>",
      "<strong>In plain words</strong>"
     ],
     "rows": [
      [
       "Program order",
       "Inside one thread, each action happens-before the next one."
      ],
      [
       "Monitor unlock → later lock",
       "Everything a thread did before leaving <code>synchronized (x)</code> is visible to the next thread that enters <code>synchronized (x)</code>."
      ],
      [
       "Volatile write → later read",
       "Everything before a write to volatile <code>v</code> is visible to a thread that reads <code>v</code> and sees that value."
      ],
      [
       "<code>thread.start()</code>",
       "Everything before <code>start()</code> is visible inside the new thread."
      ],
      [
       "Thread end → <code>join()</code> returns",
       "Everything the thread did is visible to the thread whose <code>join()</code> returned."
      ],
      [
       "Concurrency utilities",
       "Submitting to an executor → the task runs; a task&#x27;s result → <code>future.get()</code>; a <code>put</code> into a concurrent collection → a later <code>get</code> of it; <code>countDown()</code> → <code>await()</code> returning."
      ],
      [
       "Final fields (a related guarantee)",
       "Strictly not a happens-before edge but a separate rule: any thread that gets the reference after the constructor finishes sees the final fields fully set, if the constructor did not leak <code>this</code> to another thread before it finished, for example by registering a listener (Day 1 card 1.8)."
      ]
     ]
    },
    {
     "type": "sayit",
     "html": "Concurrency bugs are visibility, atomicity or ordering problems. The JMM&#x27;s happens-before relation says when one thread&#x27;s writes are guaranteed visible to another, and I get it from locks, volatile, thread start and join, final fields, or the java.util.concurrent utilities. A shared write and read without happens-before is a data race."
    }
   ]
  },
  {
   "id": "4.4",
   "title": "volatile, double-checked locking and safe singletons",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>volatile</code> gives visibility and ordering, but not atomicity. Once another thread reads the volatile field and sees the new value, it also sees every write the writer made before it. (The JMM promises this ordering, not a particular delay; in practice it is very fast.) But <code>count++</code> on a volatile int still loses updates, because the read and the write are two separate steps."
    },
    {
     "type": "p",
     "html": "<strong>The publishing pattern.</strong> With <code>volatile boolean ready</code>, writing <code>data = 42; ready = true;</code> in one thread and reading <code>if (ready) use(data);</code> in another is safe: the volatile write of <code>ready</code> carries the earlier write of <code>data</code> with it (card 4.3).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Good uses of volatile.</strong> A stop flag read in a loop. A reference to an immutable object that one thread replaces and others read (for example, a config snapshot). The instance field in double-checked locking.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Double-checked locking (DCL) and why it needs volatile.</strong> <code>instance = new Config()</code> is really three steps: allocate memory, run the constructor, store the reference. Without volatile, the store can become visible before the constructor&#x27;s writes, so a second thread sees a non-null <code>instance</code> and uses a half-built object. Making the field volatile forbids that reordering.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The best lazy singleton: the holder idiom.</strong> <code>private static class Holder { static final Config INSTANCE = new Config(); }</code> and <code>static Config get() { return Holder.INSTANCE; }</code>. The JVM initializes the Holder class only on the first call, exactly once, under the JVM&#x27;s class-initialization lock, with full happens-before. No volatile and no synchronized needed.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The enum singleton</strong> (<code>enum Config { INSTANCE }</code>) is also safe from reflection and serialization (Day 3 card 3.10).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>64-bit values.</strong> The spec allows a write to a non-volatile <code>long</code> or <code>double</code> to be split into two 32-bit halves, so a reader could see half old and half new (a torn value). Declaring the field volatile makes those reads and writes atomic. Today&#x27;s 64-bit JVMs do not actually tear them, but the guarantee only comes from volatile, an atomic class such as AtomicLong, or doing every access under the same lock.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "private static volatile Config instance;          // volatile is essential\nstatic Config get() {\n    Config c = instance;                          // copy to a local: each volatile read costs extra\n    if (c == null) {\n        synchronized (Config.class) {\n            c = instance;                         // check again under the lock\n            if (c == null) instance = c = new Config();\n        }\n    }\n    return c;\n}"
    },
    {
     "type": "sayit",
     "html": "volatile gives visibility and ordering through happens-before, but not atomicity, so count++ on a volatile still loses updates. Double-checked locking needs the field volatile, otherwise another thread can see the reference before the constructor&#x27;s writes. For a lazy singleton I prefer the holder idiom or an enum."
    }
   ]
  },
  {
   "id": "4.5",
   "title": "synchronized: what exactly gets locked",
   "blocks": [
    {
     "type": "recall",
     "html": "A <code>synchronized</code> instance method locks <code>this</code>. A <code>synchronized</code> static method locks the class&#x27;s <code>Class</code> object (for example <code>Account.class</code>). A <code>synchronized (x)</code> block locks whatever object <code>x</code> you name. The lock is reentrant: a thread that already holds it can enter another block on the same lock without blocking itself. And readers need the lock too, not just writers."
    },
    {
     "type": "p",
     "html": "<strong>Instance and static methods use different locks.</strong> A synchronized instance method and a synchronized static method of the same class can run at the same time, because one locks the object and the other locks the Class object.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why readers must lock too.</strong> Locking gives two things: atomicity (no one else is inside at the same time) and visibility (the unlock → lock happens-before edge, card 4.3). A reader that skips the lock gets neither and may see stale or half-updated data.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Reentrant, in practice.</strong> A synchronized method can call another synchronized method on the same object. The JVM counts how many times the thread entered and releases the lock only when the count returns to zero.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Always released.</strong> Leaving the block, normally or by an exception, always releases the monitor. (With ReentrantLock you must do this yourself, card 4.7.)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Use a private lock object.</strong> <code>private final Object lock = new Object();</code> and <code>synchronized (lock)</code>. If you lock <code>this</code>, any outside code can also lock your object and block you or cause a deadlock.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "Never lock on a String literal or a boxed number: <code>synchronized (&quot;LOCK&quot;)</code> or <code>synchronized (Integer.valueOf(1))</code>. Literals are pooled and small Integers are cached (Day 1), so completely unrelated classes may end up sharing the same lock object."
    },
    {
     "type": "sayit",
     "html": "An instance synchronized method locks this, a static one locks the Class object, and a block locks the object I name. It&#x27;s reentrant, it always releases on exit, and it gives both atomicity and visibility, so readers need it too. I lock on a private final object, never on strings or boxed values."
    }
   ]
  },
  {
   "id": "4.6",
   "title": "wait, notify and notifyAll",
   "blocks": [
    {
     "type": "recall",
     "html": "You may call <code>obj.wait()</code>, <code>obj.notify()</code> or <code>obj.notifyAll()</code> only while holding <code>obj</code>&#x27;s monitor; otherwise they throw <code>IllegalMonitorStateException</code>. <code>wait()</code> releases the monitor and suspends the thread (this is not <code>Thread.sleep</code>, which keeps its locks). When another thread notifies it, the waiting thread must win the monitor back before <code>wait()</code> returns. Always call <code>wait()</code> inside a <code>while</code> loop that re-checks the condition."
    },
    {
     "type": "p",
     "html": "<strong>Why <code>while</code> and never <code>if</code>.</strong> First, the JVM allows spurious wakeups: <code>wait()</code> may return even though nobody notified. Second, between being notified and getting the monitor back, another thread may have grabbed the item or changed the condition (a stolen condition). So the condition must be checked again every time <code>wait()</code> returns.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why <code>notifyAll()</code> is the safe default.</strong> <code>notify()</code> wakes one arbitrary waiting thread. In a bounded buffer, producers and consumers wait on the same monitor, so <code>notify()</code> may wake another producer when you needed a consumer, and everyone sleeps forever. <code>notifyAll()</code> wakes them all, and each re-checks its own condition.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Lost wakeup.</strong> If one thread calls <code>notify()</code> before the other thread has started waiting, and the waiter does not check any state, it then waits forever. Checking <code>while (!condition)</code> on shared state, under the lock, prevents this: if the condition is already true, the thread never waits.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Woken is not running.</strong> After <code>notify()</code>, the woken thread moves to BLOCKED (card 4.1) until the notifier leaves the synchronized block and it wins the monitor.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "synchronized (lock) {\n    while (queue.isEmpty()) lock.wait();   // releases lock while waiting; re-checks on every wakeup\n    item = queue.poll();\n    lock.notifyAll();                      // tell waiting producers there is space now\n}"
    },
    {
     "type": "sayit",
     "html": "wait and notify must be called while holding the monitor. wait releases it, and a notified thread must re-acquire it before returning, so I always wait in a while loop that re-checks the condition, to handle spurious wakeups and stolen conditions. I default to notifyAll, since notify can wake the wrong kind of waiter."
    }
   ]
  },
  {
   "id": "4.7",
   "title": "ReentrantLock, Condition, read-write locks and StampedLock",
   "blocks": [
    {
     "type": "recall",
     "html": "ReentrantLock is an explicit lock object: call <code>lock()</code>, then put your work in <code>try { ... } finally { lock.unlock(); }</code>. Compared with synchronized it adds <code>tryLock()</code> (give up if busy), timeouts, <code>lockInterruptibly()</code>, an optional fairness setting, and any number of Conditions per lock."
    },
    {
     "type": "p",
     "html": "<strong>Condition: wait/notify for a Lock.</strong> <code>lock.newCondition();</code> then",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<code>Condition notEmpty = notEmpty.await()</code> and <code>notEmpty.signal()</code>. One lock can have a <code>notFull</code> condition for producers and a <code>notEmpty</code> condition for consumers, so you wake exactly the right side, which plain wait/notify cannot do.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Fair vs non-fair.</strong> A fair lock hands the lock to the longest-waiting thread (first in, first out), which is predictable but slower. The default non-fair lock allows barging: a thread that just arrived may grab a freshly released lock ahead of the queued threads. That gives higher throughput. Note that <code>tryLock()</code> without a timeout barges even on a fair lock.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>ReentrantReadWriteLock.</strong> Many threads may hold the read lock at once, or exactly one thread holds the write lock. In fair mode the queue is first-in-first-out. In the default non-fair mode, a new reader is made to wait if the thread at the front of the queue is a writer, a rule of thumb that reduces (but does not fully prevent) writer starvation (card 4.8). Timeline: readers R1 and R2 hold the lock; writer W arrives and queues; reader R3 arrives. Without the rule, R3 would join R1 and R2, readers could keep overlapping, and W might never get in. With it, R3 waits behind W.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Upgrade deadlocks, downgrade is fine.</strong> If you hold the read lock and request the write lock, you wait for all readers to leave, including yourself, so you wait forever. To downgrade, take the read lock while holding the write lock, then release the write lock. That works because while you hold the write lock nobody else holds anything, so granting yourself the read lock conflicts with no one.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>StampedLock (Java 8).</strong> Adds an optimistic read: <code>long stamp = sl.tryOptimisticRead();</code> read the fields, then <code>if (!sl.validate(stamp))</code>, which is true when a writer took the lock since you got the stamp, fall back to a real read lock and read again. Very fast for read-heavy data, but it is not reentrant and has no Conditions.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "If you forget <code>unlock()</code> in a <code>finally</code> block, the first exception leaves the lock held forever, and every other thread waits forever."
    },
    {
     "type": "trap",
     "html": "<code>lockInterruptibly()</code> throws InterruptedException if the thread is interrupted while waiting for the lock, and also if the flag was already set when it was called."
    },
    {
     "type": "sayit",
     "html": "ReentrantLock adds tryLock, timeouts, interruptible acquisition, fairness and multiple Conditions, at the cost of an explicit unlock in finally. Non-fair locks allow barging for throughput. A read-write lock allows many readers or one writer, can&#x27;t be upgraded from read to write, but can be downgraded. StampedLock adds optimistic reads but isn&#x27;t reentrant."
    }
   ]
  },
  {
   "id": "4.8",
   "title": "Deadlock, livelock and starvation",
   "blocks": [
    {
     "type": "recall",
     "html": "A deadlock needs all four of these conditions at once: mutual exclusion (a lock can be held by one thread only), hold and wait (a thread holds one lock while waiting for another), no preemption (nobody can take a lock away), and circular wait (T1 waits for T2&#x27;s lock while T2 waits for T1&#x27;s). Break circular wait by always taking locks in one global order, or break hold-and-wait with <code>tryLock</code> and a timeout: if you cannot get the second lock, release the one you hold and back off."
    },
    {
     "type": "p",
     "html": "<strong>The classic transfer deadlock.</strong> <code>transfer(a, b)</code> locks a then b, while another thread&#x27;s <code>transfer(b, a)</code> locks b then a. Each holds one lock and waits for the other. Fix: always lock the account with the lower id first, whichever direction the money moves.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The tryLock alternative.</strong> Try to take both locks with a timeout. If you cannot get the second one, release the first, wait a short random time, and retry. The random wait matters, otherwise both threads retry in lockstep forever.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Diagnosing it.</strong> Take a thread dump with <code>jstack -l &lt;pid&gt;</code> or <code>jcmd &lt;pid&gt; Thread.print -l</code>. The JVM prints &quot;Found one Java-level deadlock&quot; and lists each thread with the lock it holds and the lock it waits for. It detects both synchronized and ReentrantLock deadlocks. In code, <code>ThreadMXBean.findDeadlockedThreads()</code> returns the thread ids, or null if there are none.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Livelock.</strong> Threads are not blocked, but they keep reacting to each other and retrying, so nothing progresses, like two people stepping aside in a corridor in the same direction again and again. Fix: random back-off.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Starvation.</strong> One thread never gets the lock or the CPU, because others keep winning (barging on an unfair lock, or a thread that holds a lock for a long time).",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "<strong>Pool-induced deadlock.</strong> All 8 threads of a pool run tasks that submit a subtask to the same pool and then call <code>future.get()</code>. The subtasks wait in the queue for a free thread, and no thread will ever be free. There is no lock cycle, so jstack reports no deadlock; you just see every pool thread WAITING in <code>Future.get</code>. Fix: use a separate pool for subtasks, or do not block on them."
    },
    {
     "type": "sayit",
     "html": "Deadlock needs mutual exclusion, hold and wait, no preemption, and circular wait, and I break circular wait with a global lock order, like locking the lower account id first, or with tryLock and randomized back-off. jstack shows lock-cycle deadlocks, but not pool-induced deadlocks where tasks block on subtasks in the same pool."
    }
   ]
  },
  {
   "id": "4.9",
   "title": "CAS, the atomic classes, LongAdder and the ABA problem",
   "blocks": [
    {
     "type": "recall",
     "html": "CAS (compare-and-swap) is one atomic hardware operation (a single instruction on x86): &quot;set this variable to NEW, but only if it still holds EXPECTED&quot;. The atomic classes (AtomicInteger, AtomicLong, AtomicReference) use it in a retry loop for operations such as <code>compareAndSet</code> and <code>updateAndGet</code> (simple <code>incrementAndGet</code> is usually compiled to a single atomic add instruction): read the current value, compute the new one, CAS, and if another thread changed the value in between, the CAS fails and the loop tries again. There is no lock and no thread is ever blocked."
    },
    {
     "type": "p",
     "html": "<strong>The main methods.</strong> <code>incrementAndGet()</code> (an atomic <code>++count</code>), <code>compareAndSet(expected, new)</code>, and <code>updateAndGet(x -&gt; f(x))</code>. Under contention the function you pass to <code>updateAndGet</code> may run several times, so it must have no side effects (no logging, no I/O, no counters).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Check-then-act on one value.</strong> To &quot;increment only if below 100&quot;, put both the check and the update in the CAS loop: <code>while (true) { int c = n.get(); if (c &gt;= 100) return false; if (n.compareAndSet(c, c + 1)) return true; }</code>. A separate <code>get()</code> followed by <code>incrementAndGet()</code> would be the race from Day 2 card 2.0.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>LongAdder.</strong> Under heavy write contention, every core fights over the single piece of memory (cache line) that holds the AtomicLong, and CAS-based updates keep failing and retrying. LongAdder spreads the count over several cells, so different threads usually update different cells; it uses CAS on those cells internally. <code>sum()</code> adds the cells up. Trade-offs: <code>sum()</code> is not an exact snapshot while writes are still happening, and LongAdder offers no <code>compareAndSet</code>. Use it for metrics and counters; use AtomicLong for ids, sequence numbers and limits that must be exact.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The ABA problem.</strong> Thread 1 reads A. Thread 2 changes it to B and back to A. Thread 1&#x27;s CAS still sees A and succeeds, even though the value changed meanwhile. For plain counters this is harmless, but it can corrupt structures built on CAS. Example, a lock-free stack (a stack whose <code>top</code> is an AtomicReference): the stack is A → B → C. Thread 1 reads top = A and plans <code>CAS(top, A, B)</code>. Thread 2 pops A, pops B, and pushes A back, so the stack is A → C. Thread 1&#x27;s CAS still sees A, succeeds, and sets top = B, a node that was already removed. C is lost. Fix: <code>AtomicStampedReference</code>, which pairs the value with a stamp (a version number); every <code>compareAndSet(expectedRef, newRef, expectedStamp, newStamp)</code> must pass a new stamp, usually the old one plus 1, so an A that came back has a different stamp.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "CAS atomically sets a value only if it still equals the expected one, and atomics wrap it in a retry loop, so they&#x27;re lock-free and non-blocking. The update function may run more than once, so it must be side-effect free. LongAdder stripes a counter across cells for heavy write contention, at the cost of exact snapshots, and ABA is solved with a stamped reference."
    }
   ]
  },
  {
   "id": "4.10",
   "title": "ThreadLocal",
   "blocks": [
    {
     "type": "recall",
     "html": "A ThreadLocal gives every thread its own separate value. Internally, each Thread object holds a small map, and the ThreadLocal object is the key in that map, so no locking is needed. Frameworks use it for per-request data: the logging MDC (request id), Spring&#x27;s current transaction, and the security context."
    },
    {
     "type": "p",
     "html": "<strong>The thread-pool leak.</strong> Pool threads are reused for many requests and never die. If request 1 sets a ThreadLocal and never calls <code>remove()</code>, request 2, running later on the same thread, sees request 1&#x27;s user or tenant. That is both a memory leak and a data leak. Always call <code>remove()</code> in a <code>finally</code> block.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>It does not follow your work to another thread.</strong> Work handed to <code>@Async</code>, an executor or an <code>...Async</code> CompletableFuture stage runs on a different thread, which starts with an empty MDC, no security context and no transaction. Copy the values across with a <code>TaskDecorator</code> (Spring) or by capturing them before submitting, and give async work its own <code>@Transactional</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>InheritableThreadLocal</strong> copies the parent&#x27;s values into a child thread when the child thread is created, not when a task is submitted. In a pool, threads are created once and reused, so the copied values are usually stale or belong to another request.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Virtual threads (bonus).</strong> Every virtual thread gets its own copies of ThreadLocals, so with a million virtual threads, a heavy ThreadLocal can use a lot of memory. ScopedValue (final in Java 25) is the newer, immutable, bounded alternative.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "ThreadLocal stores one value per thread in a map inside the Thread, so it needs no locking. In thread pools I always remove it in finally, otherwise the next request on that thread sees stale data. It doesn&#x27;t propagate to @Async or executor threads, so I copy context with a TaskDecorator and give async work its own transaction."
    }
   ]
  }
 ],
 "quiz": [
  {
   "q": "Is <code>volatile int count; count++</code> thread-safe? Why?",
   "a": "No. volatile gives visibility and ordering, not atomicity; count++ is read, add, write, so two threads can lose an update. Use AtomicInteger or a lock."
  },
  {
   "q": "Why must double-checked locking use a volatile field?",
   "a": "Without it, the reference can become visible before the constructor&#x27;s writes, so another thread may use a half-built object. volatile adds the happens-before that forbids this."
  },
  {
   "q": "Why must <code>wait()</code> be called inside a while loop?",
   "a": "Spurious wakeups can happen, and another thread may change the condition before the woken thread re-acquires the monitor. The condition must be re-checked every time."
  },
  {
   "q": "What is the difference between <code>sleep</code> and <code>wait</code> regarding locks?",
   "a": "sleep keeps every lock the thread holds; wait releases the monitor it is called on (and must be called while holding it)."
  },
  {
   "q": "A synchronized instance method and a synchronized static method of the same class: can two threads run them at the same time?",
   "a": "Yes. The instance method locks this, the static method locks the Class object; they are different locks."
  },
  {
   "q": "A thread holds a ReentrantReadWriteLock&#x27;s read lock and calls writeLock().lock(). What happens?",
   "a": "It deadlocks: the write lock waits for all readers to leave, including itself. Upgrading isn&#x27;t supported; release the read lock first."
  },
  {
   "q": "Two transfers run in opposite directions between the same two accounts and hang. Why, and what is the fix?",
   "a": "Each thread holds one account&#x27;s lock and waits for the other (circular wait). Always lock the account with the lower id first."
  },
  {
   "q": "Thread dumps show all 8 pool threads WAITING in Future.get, and jstack reports no deadlock. Likely cause?",
   "a": "Pool-induced deadlock: tasks wait for subtasks submitted to the same full pool. There is no lock cycle, so it is not detected. Use a separate pool or don&#x27;t block."
  },
  {
   "q": "When would you choose LongAdder over AtomicLong?",
   "a": "For a heavily updated counter such as a metric, where many threads increment and an approximate sum while writes run is fine. AtomicLong when you need an exact value or compareAndSet (ids, limits)."
  },
  {
   "q": "Why must you call ThreadLocal.remove() in a web app?",
   "a": "Server threads are pooled and reused, so a value left behind leaks into the next request on that thread (and leaks memory)."
  }
 ]
});
