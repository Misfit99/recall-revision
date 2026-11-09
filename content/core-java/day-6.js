/* Generated from Core_Java_SDE2_Revision_Day6_v2_dark.pdf by tools/extract_revision_pdf.py */
Revision.addUnit({
 "subject": "core-java",
 "id": "day-6",
 "source": "Core_Java_SDE2_Revision_Day6_v2_dark.pdf",
 "label": "Day 6",
 "title": "Lambdas, Streams, Optional, Modern Java, Money and Output Traps",
 "tagline": "This is the live-coding day: say the shape of the stream pipeline out loud first (filter, then group, then sum), then write it.",
 "topics": "Lambdas · Method references · Streams · Collectors · Optional · java.time · Java 9–25 · BigDecimal · Traps · Enums",
 "cards": [
  {
   "id": "6.0",
   "title": "Words this day uses (read once, then skip)",
   "blocks": [
    {
     "type": "recall",
     "html": "A few words from functional programming appear on every card today."
    },
    {
     "type": "p",
     "html": "<strong>Lambda.</strong> A short anonymous function you can pass around as a value: <code>x -&gt; x * 2</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Functional interface.</strong> An interface with exactly one abstract method, such as <code>Runnable</code> or <code>Function</code>. A lambda is always an implementation of one (card 6.1).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Target type.</strong> The type the compiler expects at the place where you write the lambda, for example the parameter type of the method you pass it to. The lambda becomes an object of that type.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Stream pipeline.</strong> A source (a list, an array), then zero or more intermediate operations that describe the work (<code>filter</code>, <code>map</code>), then one terminal operation that produces the result (<code>toList</code>, <code>sum</code>).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Lazy.</strong> Nothing runs until it is actually needed. Stream intermediate operations are lazy: they do nothing until a terminal operation asks for results.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Downstream collector.</strong> A second collector you pass inside <code>groupingBy</code>, which decides what to do with each group (count it, sum it...).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Boxing.</strong> Turning a primitive <code>int</code> into an <code>Integer</code> object (and unboxing back). It costs time and memory, and unboxing a null throws NullPointerException.",
     "bullet": true
    }
   ]
  },
  {
   "id": "6.1",
   "title": "Lambdas and functional interfaces",
   "blocks": [
    {
     "type": "recall",
     "html": "A functional interface has exactly one abstract method. Default methods, static methods, and public methods that every class already gets from <code>Object</code> (such as <code>equals</code>) do not count. That is why <code>Comparator</code> qualifies even though it declares <code>equals</code>. A lambda has no type of its own: its type comes from the target type. Any local variable a lambda uses from outside must be effectively final, meaning it is never reassigned after being set."
    },
    {
     "type": "p",
     "html": "<strong>Why captured locals must be effectively final.</strong> The lambda captures a copy of the local variable&#x27;s value, and it may run later, even on another thread, after the method has returned and the variable is gone. If the variable could still change, the copy and the original would silently disagree, so Java forbids reassigning it. Fields are different: the lambda captures <code>this</code> and reads the current field value each time.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Lambda vs anonymous class.</strong> Inside a lambda, <code>this</code> means the enclosing object, and the lambda has no scope of its own, so you cannot declare a variable with the same name as an outer local. A lambda can only implement a functional interface, and it is compiled using <code>invokedynamic</code> (bonus: a JVM instruction that creates the lambda&#x27;s object at run time, the first time that line runs), so no separate .class file is written. An anonymous class has its own <code>this</code>, its own scope, can implement any interface or extend an abstract class, can have fields, and is compiled into a file like <code>Outer$1.class</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The standard shapes in java.util.function.</strong> <code>Function&lt;T, R&gt;</code> takes T and returns R. <code>Predicate&lt;T&gt;</code> takes T and returns boolean. <code>Consumer&lt;T&gt;</code> takes T and returns nothing. <code>Supplier&lt;T&gt;</code> takes nothing and returns T. <code>BiFunction&lt;T, U, R&gt;</code> takes two inputs. <code>UnaryOperator&lt;T&gt;</code> is a Function from T to T, and <code>BinaryOperator&lt;T&gt;</code> combines two Ts into one. Primitive versions such as <code>IntPredicate</code> and <code>ToLongFunction</code> avoid boxing.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Checked exceptions.</strong> These interfaces declare no checked exceptions, so a lambda written for them cannot throw one (Day 3 card 3.6).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "A functional interface has exactly one abstract method, and a lambda takes its type from the target. Captured locals must be effectively final because the lambda captures a copy and may run later on another thread. Unlike an anonymous class, a lambda&#x27;s this is the enclosing instance, it has no own scope, and it&#x27;s compiled via invokedynamic."
    }
   ]
  },
  {
   "id": "6.2",
   "title": "Method references: the four kinds",
   "blocks": [
    {
     "type": "recall",
     "html": "A method reference is a shorter way to write a lambda that only calls one existing method. There are four kinds, and the difference that matters is where the object the method runs on comes from."
    },
    {
     "type": "p",
     "html": "<strong>Bound vs unbound, in plain words.</strong> A bound reference (<code>ledger::post</code>) already has its object: you named a specific object before the <code>::</code>, so each input becomes the method&#x27;s argument. An unbound reference (<code>String::length</code>) names only a class before the <code>::</code>, so the first input is used as the object the method runs on. With two inputs, as in <code>BigDecimal::add</code> used as a BinaryOperator, the first input is the object and the second is the argument: <code>(a, b) -&gt; a.add(b)</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Constructor references.</strong> <code>ArrayList::new</code> means <code>() -&gt; new ArrayList&lt;&gt;()</code> (or with an argument, <code>n -&gt; new ArrayList&lt;&gt;(n)</code>). <code>Trade[]::new</code> creates an array, as in <code>stream.toArray(Trade[]::new)</code>.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>Kind</strong>",
      "<strong>Example</strong>",
      "<strong>Equivalent lambda</strong>"
     ],
     "rows": [
      [
       "Static method",
       "<code>Integer::parseInt</code>",
       "<code>s -&gt; Integer.parseInt(s)</code>"
      ],
      [
       "Bound (a specific object)",
       "<code>ledger::post</code>",
       "<code>t -&gt; ledger.post(t)</code>"
      ],
      [
       "Unbound (any object of the class)",
       "<code>String::length</code>",
       "<code>s -&gt; s.length()</code>"
      ],
      [
       "Constructor",
       "<code>ArrayList::new</code>",
       "<code>() -&gt; new ArrayList&lt;&gt;()</code>"
      ]
     ]
    },
    {
     "type": "trap",
     "html": "A bound reference evaluates the object before <code>::</code> once, when the reference is created. So if <code>ledger</code> is null, <code>ledger::post</code> throws NullPointerException immediately, on that line, even if the reference is never called. The lambda <code>t -&gt; ledger.post(t)</code> would only fail later, when called. And if <code>ledger</code> is a field (a local could not change anyway, card 6.1), the lambda reads the field each time it runs, so it uses whatever <code>ledger</code> is at that moment."
    },
    {
     "type": "sayit",
     "html": "There are four kinds of method reference: static, bound to a specific object, unbound where the first argument becomes the receiver, and constructor. A bound reference evaluates its receiver when it&#x27;s created, so a null receiver throws immediately, unlike the equivalent lambda."
    }
   ]
  },
  {
   "id": "6.3",
   "title": "How a stream runs",
   "blocks": [
    {
     "type": "recall",
     "html": "Streams are lazy. Intermediate operations (<code>filter</code>, <code>map</code>, <code>sorted</code>, <code>distinct</code>, <code>limit</code>, <code>peek</code>) only build up a description of the pipeline. Nothing happens until a terminal operation (<code>toList</code>, <code>collect</code>, <code>count</code>, <code>findFirst</code>, <code>anyMatch</code>, <code>reduce</code>, <code>forEach</code>) is called. The terminal operation then runs the pipeline on the calling thread, pushing one element at a time through all the stages, not one stage at a time over the whole list."
    },
    {
     "type": "p",
     "html": "<strong>One element at a time, with an example.</strong> Imagine helper lambdas that print a label and let the element through: <code>filter(x -&gt; { System.out.println(&quot;filter &quot; + x); return true; })</code> and the same for <code>map</code>. For <code>Stream.of(&quot;a&quot;, &quot;b&quot;, &quot;c&quot;)</code> with that filter, that map, then <code>findFirst()</code>, the output is &quot;filter a&quot; then &quot;map a&quot;, and nothing else: &quot;a&quot; goes through filter and map, findFirst has its answer, and the stream stops.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Short-circuiting.</strong> <code>findFirst</code>, <code>anyMatch</code>, <code>allMatch</code> and <code>limit</code> can stop early. <code>sorted</code> cannot: it must see every element before it can output the first, so it acts as a barrier in the pipeline.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Rules.</strong> A stream can be used only once; any further operation on a consumed stream, even an intermediate one, throws <code>IllegalStateException</code>. Never modify the source collection while the stream runs. <code>peek</code> is only for debugging and may not run at all: since Java 9, <code>list.stream().peek(...).count()</code> can compute the count straight from the list&#x27;s size and skip the elements.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>map vs flatMap.</strong> <code>map</code> turns each element into exactly one new element. <code>flatMap</code> turns each element into a stream of elements and joins all those streams into one, for example <code>orders.stream().flatMap(o -&gt; o.lines().stream())</code> gives every order line.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Java 9 additions.</strong> <code>takeWhile(pred)</code> takes elements while the condition holds and stops at the first failure; <code>dropWhile(pred)</code> skips elements until the first failure and keeps the rest, including that element. Example on [1, 2, 5, 1]: <code>takeWhile(x -&gt; x &lt; 3)</code> gives [1, 2]; <code>dropWhile(x -&gt; x &lt; 3)</code> gives [5, 1]. Both make sense on ordered data, such as a time-sorted list.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Useful sources.</strong> <code>IntStream.range(0, n)</code> for indexes; <code>s.chars()</code> for the characters of a String (as ints); <code>Files.lines(path)</code> for a file&#x27;s lines, always in try-with-resources (Day 3 card 3.8).",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Intermediate operations are lazy and only describe the pipeline; the terminal operation pulls elements through every stage one at a time on the calling thread. findFirst, anyMatch and limit short-circuit, sorted is a barrier, and a stream can be consumed only once."
    }
   ]
  },
  {
   "id": "6.4",
   "title": "reduce, primitive streams and parallel streams",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>reduce(identity, op)</code> folds all elements into one value: it starts from the identity and applies op to combine. The identity must be a neutral starting value that changes nothing (0 for addition, 1 for multiplication, <code>BigDecimal.ZERO</code> for money), and op must be associative, meaning the grouping does not matter: (a op b) op c = a op (b op c). Without an identity, <code>reduce(op)</code> returns an Optional, because the stream may be empty."
    },
    {
     "type": "p",
     "html": "<strong>Why the rules matter: parallel.</strong> A parallel stream splits the data into chunks, reduces each chunk starting from the identity, then combines the chunk results. So <code>reduce(10, Integer::sum)</code> adds 10 once per chunk, and the total comes out wrong. An operation that is not associative, such as subtraction, also gives different answers depending on how the data was split.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Primitive streams.</strong> <code>mapToInt(Emp::age)</code> gives an IntStream with <code>sum()</code>, <code>average()</code> (an OptionalDouble), <code>max()</code> and <code>summaryStatistics()</code> (count, min, max, average and sum in one pass), all without boxing. <code>boxed()</code> converts back to a Stream&lt;Integer&gt;.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>When parallel streams help.</strong> Only for large, CPU-heavy work on sources that split cheaply, such as an ArrayList or an array (internally a Spliterator divides the source; a LinkedList splits poorly). They run on the shared common pool (Day 4B card 4.15), so never use them for blocking I/O such as database or HTTP calls.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "<code>list.parallelStream().forEach(results::add)</code> where <code>results</code> is a plain ArrayList: several threads call <code>add</code> at once, ArrayList is not thread-safe, and elements are silently lost (or an ArrayIndexOutOfBoundsException appears). Collect instead: <code>.toList()</code> or <code>.collect(...)</code>."
    },
    {
     "type": "sayit",
     "html": "reduce needs a true identity and an associative operation, because a parallel stream applies the identity to every chunk and combines the partial results. I use primitive streams like mapToInt to avoid boxing, and parallel streams only for large CPU-bound work on splittable sources, never for blocking I/O, and never with forEach into a non-thread-safe list."
    }
   ]
  },
  {
   "id": "6.5",
   "title": "Collectors",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>groupingBy(key)</code> gives a <code>Map&lt;K, List&lt;T&gt;&gt;</code>. Add a downstream collector to decide what each group becomes: <code>counting()</code> (returns a Long), <code>averagingInt(...)</code> (a Double), <code>mapping(f, toList())</code> (transform each element first), <code>reducing(BigDecimal.ZERO, Txn::amount, BigDecimal::add)</code> (sum money), or <code>maxBy(comparator)</code> (an Optional), often wrapped in <code>collectingAndThen</code> to unwrap it."
    },
    {
     "type": "p",
     "html": "<strong>The pieces used in the code below.</strong> <code>reducing(start, mapper, combine)</code>: start from <code>start</code>, turn each element into a value with <code>mapper</code>, combine values with <code>combine</code> (the same as <code>map(mapper).reduce(start, combine)</code>). <code>collectingAndThen(collector, finisher)</code>: run the collector, then apply one more function to its result. <code>groupingBy(key, mapFactory, downstream)</code>: the middle argument chooses the map type, such as <code>LinkedHashMap::new</code> to keep insertion order. <code>Function.identity()</code> is the function <code>x -&gt; x</code>. <code>reverseOrder()</code> is <code>Comparator.reverseOrder()</code>, statically imported.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>toMap(keyFn, valueFn)</code></strong> throws <code>IllegalStateException</code> on a duplicate key and NullPointerException on a null value. Add a merge function for duplicates, <code>(a, b) -&gt; a</code> to keep the first, and when order matters use the four-argument form <code>toMap(keyFn, valueFn, merge, LinkedHashMap::new)</code> (or <code>TreeMap::new</code>).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>partitioningBy(predicate)</code></strong> splits into exactly two groups and always contains both keys, <code>true</code> and <code>false</code>, even if one group is empty. <code>joining(&quot;, &quot;)</code> concatenates Strings. <code>teeing(c1, c2, merger)</code> (Java 12) runs two collectors over the same stream and merges their results, for example min and max in one pass.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>stream.toList()</code> vs <code>Collectors.toList()</code>.</strong> <code>stream.toList()</code> (Java 16) returns an unmodifiable list. <code>collect(Collectors.toList())</code> returns a list with no promise about modifiability (in practice an ArrayList). If code later adds to the result, it matters which one you used.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Money.</strong> There is no <code>summingBigDecimal</code>. Use <code>reducing(BigDecimal.ZERO, Txn::amount, BigDecimal::add)</code> or <code>map(Txn::amount).reduce(BigDecimal.ZERO, BigDecimal::add)</code>. Never sum money as double (card 6.9).",
     "bullet": true
    },
    {
     "type": "code",
     "code": "// total amount of SUCCESS transactions per currency\ntxns.stream().filter(t -> t.status() == SUCCESS)\n    .collect(groupingBy(Txn::currency, reducing(BigDecimal.ZERO, Txn::amount, BigDecimal::add)));\n// name of the top earner per department\nemps.stream().collect(groupingBy(Emp::dept,\n    collectingAndThen(maxBy(comparing(Emp::salary)), o -> o.orElseThrow().name())));  // a group is never empty\n// second-highest distinct salary (an Optional); if salary is a BigDecimal, distinct() uses equals,\n// so 100.0 and 100.00 count as different: normalize the scale first\nemps.stream().map(Emp::salary).distinct().sorted(reverseOrder()).skip(1).findFirst();\n// first non-repeating character (LinkedHashMap keeps the original order)\ns.chars().mapToObj(c -> (char) c)\n .collect(groupingBy(Function.identity(), LinkedHashMap::new, counting()))\n .entrySet().stream().filter(e -> e.getValue() == 1)   // Long vs int literal: unboxed, so == is safe\n .map(Map.Entry::getKey).findFirst();\n// top 3 accounts by total (totals is a Map<String, BigDecimal>); the <String, BigDecimal> tells the\n// compiler the types, because .reversed() hides the target type (same reason as the trap in card 6.6)\ntotals.entrySet().stream()\n    .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())\n    .limit(3).map(Map.Entry::getKey).toList();"
    },
    {
     "type": "trap",
     "html": "<code>Map&lt;String, Integer&gt; m = emps.stream().collect(groupingBy(Emp::dept, counting()));</code> does not compile, because <code>counting()</code> produces a Long: the type is <code>Map&lt;String, Long&gt;</code>."
    },
    {
     "type": "sayit",
     "html": "groupingBy produces lists by default, and a downstream collector like counting, averaging, mapping, reducing or maxBy turns each group into a value. toMap needs a merge function for duplicate keys. partitioningBy always has both keys, and for money I sum BigDecimal with reducing, never doubles."
    }
   ]
  },
  {
   "id": "6.6",
   "title": "Optional, and comparator chains",
   "blocks": [
    {
     "type": "recall",
     "html": "Optional is meant for return values that may be absent, so the caller is forced to deal with &quot;no result&quot;. <code>orElse(x)</code> always evaluates x, because Java evaluates a method&#x27;s arguments before calling it, even when the Optional has a value. <code>orElseGet(() -&gt; x)</code> runs the supplier only when the Optional is empty. Use <code>flatMap</code> instead of <code>map</code> when the function you apply itself returns an Optional: <code>findUser(id).flatMap(User::findAddress)</code> gives <code>Optional&lt;Address&gt;</code>, while <code>map</code> would give <code>Optional&lt;Optional&lt;Address&gt;&gt;</code>."
    },
    {
     "type": "p",
     "html": "<strong>Why <code>orElse</code> vs <code>orElseGet</code> matters.</strong> <code>cache.find(id).orElse(loadFromDb(id))</code> calls the database every single time, even on a cache hit. Write <code>orElseGet(() -&gt; loadFromDb(id))</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Don&#x27;ts.</strong> Do not call a bare <code>get()</code>; use <code>orElseThrow()</code> (Java 10), which states the intent. Do not use Optional for fields or method parameters, and do not return <code>Optional&lt;List&lt;...&gt;&gt;</code> (return an empty list instead). Never return null from a method declared to return Optional.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Comparator chains</strong> (Day 2 card 2.7). <code>comparing(Trade::desk).thenComparing(Trade::notional, reverseOrder()).thenComparing(Trade::id)</code>. Calling <code>.reversed()</code> at the end reverses the entire chain built so far, not just the last key. To reverse only one key, pass <code>reverseOrder()</code> for that key, as here.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>End the chain on a unique key.</strong> TreeSet and TreeMap treat compare = 0 as a duplicate (Day 2 card 2.5), so two different trades with the same desk and notional would be merged into one unless the chain ends with something unique like the id.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "<code>comparing(e -&gt; e.salary()).reversed()</code> does not compile: a lambda parameter like <code>e</code> has no type written on it, so the compiler normally learns it from where the result is used (the target type). Here the result of <code>comparing(...)</code> is used only to call <code>.reversed()</code> on it, which gives no clue, so the compiler falls back to Object, which has no <code>salary()</code>. A method reference <code>Emp::salary</code> names its class, so the compiler knows the type without help. Write <code>comparing(Emp::salary).reversed()</code> or <code>comparing((Emp e) -&gt; e.salary()).reversed()</code>."
    },
    {
     "type": "sayit",
     "html": "Optional is for return values that may be absent. orElse evaluates its argument eagerly, so for anything expensive I use orElseGet, and I use orElseThrow rather than get. In comparator chains reversed at the end flips everything, so I pass reverseOrder for a single key and end on a unique key for sorted collections."
    }
   ]
  },
  {
   "id": "6.7",
   "title": "java.time: dates and times done right",
   "blocks": [
    {
     "type": "recall",
     "html": "Store moments as <code>Instant</code> (a point on the UTC timeline). Use <code>LocalDate</code> for calendar dates with no time zone, such as a trade date or settlement date, and <code>ZonedDateTime</code> when time-zone rules matter (what time is 9 am in New York, across daylight saving changes). All java.time classes are immutable and thread-safe. <code>DateTimeFormatter</code> is thread-safe too, unlike the old <code>SimpleDateFormat</code>, which breaks when shared between threads. For testable code, inject a <code>Clock</code> instead of calling <code>Instant.now()</code> directly, so tests can fix the time."
    },
    {
     "type": "p",
     "html": "<strong>Daylight saving (DST).</strong> On a ZonedDateTime, <code>plusDays(1)</code> keeps the same clock time (9:00 tomorrow), so across a DST change it may be 23 or 25 real hours later. <code>plusHours(24)</code> adds exactly 24 hours, which may land at 8:00 or 10:00.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Month arithmetic.</strong> 31 January plus one month is 28 February (29 in a leap year): the day is clamped to the month&#x27;s length. Adding another month gives 28 March (29 March in a leap year), not 31 March, because the clamping is not undone.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Immutability trap.</strong> <code>date.plusDays(1);</code> on its own line does nothing: it returns a new date that you ignored. Write <code>date = date.plusDays(1);</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Which type for a JPA entity or an API.</strong> <code>LocalDateTime</code> has no zone at all, so it is only safe if every service and database agrees on one zone (usually UTC); otherwise 10:00 is ambiguous. For timestamps prefer <code>Instant</code>, or <code>OffsetDateTime</code> (a time with a fixed offset such as +05:30), which maps cleanly to SQL <code>TIMESTAMP WITH TIME ZONE</code> and ISO-8601 strings. <code>ZonedDateTime</code> carries a region such as Asia/Kolkata with its DST rules, which you need for scheduling and display, not for storage.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A fixed Clock in tests.</strong> <code>Clock clock = Clock.fixed(Instant.parse(&quot;2026-03-31T10:00:00Z&quot;), ZoneOffset.UTC);</code> then call <code>LocalDate.now(clock)</code> in the code under test.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "In a DateTimeFormatter pattern, <code>YYYY</code> is the week-based year, not the calendar year. Week-based years count whole weeks: in the ISO system, week 1 is the Monday-to-Sunday week that contains the year&#x27;s first Thursday. 30 December 2024 is a Monday in the week that contains 2 January 2025, so it belongs to week 1 of 2025, and <code>YYYY-MM-dd</code> prints <code>2025-12-30</code>. Always use <code>yyyy</code> (or <code>uuuu</code>, the same for modern dates)."
    },
    {
     "type": "sayit",
     "html": "I store Instants in UTC, use LocalDate for business dates like settlement dates, and ZonedDateTime for zone rules, all immutable and thread-safe, with an injected Clock for tests. I watch for DST, where plusDays keeps clock time and plusHours doesn&#x27;t, month-end clamping, and YYYY versus yyyy in patterns."
    }
   ]
  },
  {
   "id": "6.8",
   "title": "What changed from Java 9 to Java 25",
   "blocks": [
    {
     "type": "recall",
     "html": "Know one feature per landmark release, especially the LTS (long-term support) versions 11, 17, 21 and 25: collection factories <code>List.of</code> (9); <code>var</code> for local variables (10); new String methods such as <code>isBlank</code>, <code>strip</code>, <code>lines</code>, <code>repeat</code> and the built-in HttpClient (11); switch expressions (14); text blocks (15); records, pattern matching for <code>instanceof</code> and <code>Stream.toList()</code> (16); sealed classes (17); pattern matching in switch, record patterns, virtual threads and sequenced collections (21); and scoped values (finalized, no longer a preview, in 25)."
    },
    {
     "type": "p",
     "html": "<strong>One line each.</strong> Pattern matching for instanceof: <code>if (obj instanceof Card c)</code> tests and casts in one step. Virtual threads: very cheap JVM-scheduled threads for blocking I/O (Day 4B card 4.20). Scoped values: an immutable, bounded replacement for ThreadLocal (Day 4A card 4.10).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>var</code></strong> works only for local variables with an initializer (<code>var orders = new ArrayList&lt;Order&gt;();</code>), never for fields, method parameters or return types (lambda parameters may use <code>var</code> since Java 11). The type is still fixed at compile time; Java does not become dynamically typed.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Records</strong> (16) are shallowly immutable data carriers (fields are final; copy mutable components such as lists) with generated constructor, accessors, <code>equals</code>, <code>hashCode</code> and <code>toString</code> (Day 1 card 1.8).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Sealed types + records + switch.</strong> <code>sealed interface Payment permits Card, Upi {}</code> lists every allowed subtype. A <code>switch</code> over a Payment that handles both needs no <code>default</code>, and if someone adds a third subtype later, every such switch stops compiling until it handles the new case. The compiler finds every place you forgot.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Sequenced collections</strong> (21) add <code>getFirst()</code>, <code>getLast()</code> and <code>reversed()</code> to lists, deques, LinkedHashSet and TreeSet, and <code>firstEntry()</code>, <code>lastEntry()</code> and <code>reversed()</code> to LinkedHashMap and TreeMap.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bonus, newer releases.</strong> Unnamed variables <code>_</code> (22), stream gatherers for custom intermediate operations (24), and in Java 25 flexible constructor bodies (statements allowed before <code>super(...)</code>) and compact source files with a simple <code>void main()</code>.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "sealed interface Payment permits Card, Upi {}\nrecord Card(String last4) implements Payment {}\nrecord Upi(String vpa) implements Payment {}\nString describe(Payment p) {\n    return switch (p) {                          // exhaustive: no default needed\n        case Card c -> \"card ending \" + c.last4();\n        case Upi(String vpa) -> \"UPI \" + vpa;   // record pattern takes the component apart\n    };\n}"
    },
    {
     "type": "sayit",
     "html": "The big landmarks are var in 10, the String and HttpClient additions in 11, records and pattern instanceof in 16, sealed types in 17, and in 21 pattern matching for switch, record patterns, virtual threads and sequenced collections. Sealed interfaces with records and an exhaustive switch let the compiler flag every switch I forget to update when I add a subtype."
    }
   ]
  },
  {
   "id": "6.9",
   "title": "BigDecimal: handling money",
   "blocks": [
    {
     "type": "recall",
     "html": "Create a BigDecimal from a String, never from a double: <code>new BigDecimal(&quot;0.1&quot;)</code>. A double cannot hold 0.1 exactly, and <code>new BigDecimal(0.1)</code> faithfully keeps that binary error (0.1000000000000000055511...). BigDecimal is immutable, so write <code>total = total.add(x)</code>. <code>divide</code> without a scale only works when the exact result ends (10 ÷ 2 = 5 is fine); 1 ÷ 3 never ends and throws ArithmeticException, so for money always pass a scale and a RoundingMode. <code>equals</code> compares the scale too (2.0 is not equal to 2.00), while <code>compareTo</code> compares only the value."
    },
    {
     "type": "p",
     "html": "<strong><code>BigDecimal.valueOf(0.1)</code> is fine.</strong> It goes through <code>Double.toString(0.1)</code>, which gives &quot;0.1&quot;, so it produces exactly 0.1. Only the constructor that takes a double is the trap.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Rounding.</strong> <code>amount.setScale(2, RoundingMode.HALF_UP)</code> rounds to 2 decimal places the way people learn at school. <code>HALF_EVEN</code> (banker&#x27;s rounding) rounds an exact .5 to the nearest even digit (2.345 becomes 2.34, 2.355 becomes 2.36), so rounding errors cancel out over many operations; it is the usual choice for interest and FX calculations.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Scale from the currency.</strong> INR and USD have 2 decimal places, JPY has 0 and KWD has 3; <code>Currency.getInstance(&quot;JPY&quot;).getDefaultFractionDigits()</code> tells you. Hard-coding 2 breaks for some currencies.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Comparing amounts.</strong> Use <code>a.compareTo(b) == 0</code>, or <code>signum()</code> to test for zero, positive or negative. Using <code>equals</code> makes 10.0 and 10.00 different, which also affects HashSet and HashMap keys and <code>distinct()</code>, while a TreeSet or TreeMap, which uses compareTo, treats them as one (Day 2 card 2.5).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why not double for money.</strong> <code>0.1 + 0.2</code> is 0.30000000000000004 in double. Small errors like this add up across millions of transactions and reconciliations stop matching.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "new BigDecimal(0.1)                    // 0.1000000000000000055511151231257827... (wrong)\nnew BigDecimal(\"0.1\")                  // 0.1 (right)\nBigDecimal.ONE.divide(new BigDecimal(\"3\"))                      // ArithmeticException\nBigDecimal.ONE.divide(new BigDecimal(\"3\"), 2, RoundingMode.HALF_EVEN)  // 0.33\nnew BigDecimal(\"2.0\").equals(new BigDecimal(\"2.00\"))            // false (scale differs)\nnew BigDecimal(\"2.0\").compareTo(new BigDecimal(\"2.00\"))         // 0 (same value)"
    },
    {
     "type": "sayit",
     "html": "For money I build BigDecimal from Strings or valueOf, never the double constructor, reassign because it&#x27;s immutable, always give divide a scale and rounding mode, use HALF_EVEN for interest and FX with the scale taken from the currency, and compare amounts with compareTo, since equals also compares scale."
    }
   ]
  },
  {
   "id": "6.10",
   "title": "Output traps, numbers and pass-by-value",
   "blocks": [
    {
     "type": "recall",
     "html": "Interviewers love &quot;what does this print?&quot; questions. Most of them hinge on one of a few traps: regex in <code>split</code>, the fixed-size list from <code>Arrays.asList</code>, unboxing a null, silent integer overflow, negative remainders, char arithmetic, NaN, and the fact that Java always passes arguments by value."
    },
    {
     "type": "p",
     "html": "<strong>Pass-by-value, precisely.</strong> Java always passes a copy of the value. For an object variable, the value is the reference, so the method gets a copy of the reference. The method can therefore change the object&#x27;s contents (<code>list.add(x)</code> is visible to the caller), but if it assigns a new object to its parameter (<code>list = new ArrayList&lt;&gt;()</code>), the caller&#x27;s variable still points to the old object.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>Arrays.asList</code>.</strong> It returns a fixed-size list backed by the array: <code>set</code> works, <code>add</code> and <code>remove</code> throw UnsupportedOperationException (Day 2 card 2.5). <code>Arrays.asList(new int[]{1, 2, 3})</code> is a list with one element, the int array itself, because generics cannot hold primitives; use <code>Arrays.stream(arr).boxed().toList()</code> or an <code>Integer[]</code>. <code>List.of(...).contains(null)</code> throws NullPointerException, because the Java 9 immutable collections reject null everywhere by design.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Unboxing a null.</strong> <code>int v = map.get(&quot;missing&quot;);</code> throws NullPointerException, because get returns a null Integer and Java unboxes it to an int. A ternary does the same: <code>Integer x = flag ? map.get(k) : 0;</code> has type int (because of the 0), so a null from the map is unboxed and throws.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The Integer cache</strong> (Day 1 card 1.7). <code>==</code> on two autoboxed Integers (made by <code>Integer.valueOf</code>) is true for −128 to 127 by default and usually false beyond, so always use <code>equals</code>. <code>list.remove(1)</code> on a <code>List&lt;Integer&gt;</code> removes index 1; <code>list.remove(Integer.valueOf(1))</code> removes the value 1.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Integer overflow is silent.</strong> <code>24 * 60 * 60 * 1000 * 1000</code> (microseconds in a day) is computed in int and wraps around to 500654080 with no error. Make the first number a long, <code>24L * 60 * ...</code>, or use <code>Math.multiplyExact</code>, which throws on overflow.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Negative numbers in hashing.</strong> <code>Math.abs(Integer.MIN_VALUE)</code> is still negative, because +2147483648 does not fit in an int. And <code>%</code> keeps the sign of the left side: <code>-7 % 3</code> is −1, not 2. So for choosing a shard or partition from a hash code, use <code>Math.floorMod(hash, n)</code>, which always returns 0 to n−1.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>char arithmetic and NaN.</strong> <code>&#x27;a&#x27; + &#x27;b&#x27; + &quot;c&quot;</code> is &quot;195c&quot;: the two chars are added as numbers first (97 + 98), then the String is appended. <code>Double.NaN == Double.NaN</code> is false; test with <code>Double.isNaN(x)</code>.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "\"a|b\".split(\"|\")      // [a, |, b] : the argument is a regex; an unescaped | means empty-or-empty, which matches between every character\n                        //   (the leading empty string is dropped automatically since Java 8)\n\"a|b\".split(\"\\\\|\")   // [a, b]    : escape the pipe in the regex\n\"a,b,,\".split(\",\")     // [a, b]    : trailing empty strings are dropped\n\"a,b,,\".split(\",\", -1) // [a, b, , ] : a negative limit keeps them"
    },
    {
     "type": "sayit",
     "html": "Java is always pass-by-value; for objects the value is a copy of the reference, so a method can mutate the object but can&#x27;t re-point the caller&#x27;s variable. Other classic traps are split taking a regex, Arrays.asList being fixed-size, unboxing nulls, silent int overflow, Math.abs of MIN_VALUE staying negative so I shard with floorMod, and NaN never equalling itself."
    }
   ]
  },
  {
   "id": "6.11",
   "title": "Enums, EnumMap and EnumSet",
   "blocks": [
    {
     "type": "recall",
     "html": "Every enum implicitly extends <code>java.lang.Enum</code>, its constructors are always private, and each constant is a single shared instance, so comparing with <code>==</code> is safe and even null-safe (<code>status == Status.ACTIVE</code> is simply false when status is null, while <code>status.equals(...)</code> would throw). A constant can have its own body (like FLAT and PERCENT in the code below), which makes it an anonymous subclass of the enum, so <code>getClass()</code> returns that subclass (such as <code>Fee$1</code>), while <code>getDeclaringClass()</code> still returns the enum type <code>Fee</code>. <code>values()</code> returns a new copy of the array on every call, and <code>valueOf(&quot;name&quot;)</code> is case-sensitive and throws IllegalArgumentException for an unknown name."
    },
    {
     "type": "p",
     "html": "<strong>An enum as a strategy.</strong> Give the enum an abstract method and implement it in each constant&#x27;s body. Each fee type, for example, then carries its own calculation, and the compiler forces every new constant to implement it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Persisting enums with JPA.</strong> Use <code>@Enumerated(EnumType.STRING)</code>, never the default <code>ORDINAL</code>. ORDINAL stores the position number (0, 1, 2), so inserting a new constant in the middle, or reordering them, silently changes the meaning of every row already in the database.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>EnumMap and EnumSet.</strong> EnumMap is a Map with enum keys, stored internally as a plain array indexed by the constant&#x27;s position (its ordinal), so it is faster and smaller than a HashMap and iterates in declaration order. EnumSet stores its members as bits in a long (one bit per constant for enums of up to 64 constants; larger enums use an array of longs), so <code>contains</code> and set operations are a few CPU instructions. Use them whenever the keys or members are an enum.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The best singleton.</strong> An enum with one constant is safe against reflection, cloning and serialization (Day 3 card 3.10).",
     "bullet": true
    },
    {
     "type": "code",
     "code": "enum Fee {\n    FLAT    { BigDecimal on(BigDecimal amt) { return new BigDecimal(\"10.00\"); } },\n    PERCENT { BigDecimal on(BigDecimal amt) { return amt.multiply(new BigDecimal(\"0.02\")); } };\n    abstract BigDecimal on(BigDecimal amt);      // every constant must implement it\n}\nMap<Fee, BigDecimal> totals = new EnumMap<>(Fee.class);\nEnumSet<DayOfWeek> weekend = EnumSet.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY);"
    },
    {
     "type": "trap",
     "html": "An enum&#x27;s constructor is not allowed to read the enum&#x27;s own static fields, except compile-time constants such as <code>static final String PREFIX = &quot;FEE_&quot;</code> (Day 1 card 1.5). The compiler rejects it because the constants are created first, before the other static fields are initialized, so a static Map the constructor wanted to register into would still be null at that moment. Fill such a lookup map in a <code>static { }</code> block after the constants instead."
    },
    {
     "type": "sayit",
     "html": "Enums extend Enum, have private constructors and one instance per constant, so == is safe. Constants can carry their own behaviour like a strategy, I persist them with EnumType.STRING, never ORDINAL, and I use EnumMap and EnumSet, which are array- and bit-vector-backed, whenever the keys are enum values."
    }
   ]
  }
 ],
 "quiz": [
  {
   "q": "<code>Optional.of(&quot;cached&quot;).orElse(fetchFromDb())</code>: does fetchFromDb run?",
   "a": "Yes. Java evaluates the argument before calling orElse. Use orElseGet(() -&gt; fetchFromDb()) so it runs only when the Optional is empty."
  },
  {
   "q": "Write: count of employees per department.",
   "a": "<code>emps.stream().collect(groupingBy(Emp::dept, counting()))</code>, which gives a Map&lt;String, Long&gt;."
  },
  {
   "q": "<code>Stream.of(&quot;a&quot;,&quot;b&quot;,&quot;c&quot;).filter(print).map(print).findFirst()</code>: what prints?",
   "a": "&quot;filter a&quot; then &quot;map a&quot; only: elements flow one at a time and findFirst stops after the first."
  },
  {
   "q": "Why can <code>reduce(10, Integer::sum)</code> give a different answer in a parallel stream?",
   "a": "The identity is applied once per chunk, so 10 is added several times. The identity must be neutral (0 for sum)."
  },
  {
   "q": "<code>ledger</code> is null. What happens at <code>Consumer&lt;Txn&gt; c = ledger::post;</code>?",
   "a": "NullPointerException right there: a bound method reference evaluates its receiver when it is created."
  },
  {
   "q": "Why can <code>Math.abs(key.hashCode()) % n</code> produce a negative shard index?",
   "a": "abs(Integer.MIN_VALUE) is still negative (no positive int fits). Use Math.floorMod(h, n)."
  },
  {
   "q": "<code>new BigDecimal(&quot;2.0&quot;).equals(new BigDecimal(&quot;2.00&quot;))</code>? And in a TreeSet?",
   "a": "false (equals includes scale); a TreeSet keeps only one, because compareTo returns 0."
  },
  {
   "q": "A method does <code>list = new ArrayList&lt;&gt;(); list.add(1);</code> on its parameter. What does the caller&#x27;s list contain?",
   "a": "It is unchanged. The method only re-pointed its own copy of the reference; Java is pass-by-value."
  },
  {
   "q": "What does <code>&quot;a|b&quot;.split(&quot;|&quot;)</code> return, and why?",
   "a": "[a, |, b]: split takes a regex, and an unescaped | splits at every position. Use split(&quot;\\\\|&quot;)."
  },
  {
   "q": "Why should a JPA enum column use EnumType.STRING?",
   "a": "ORDINAL stores the position, so adding or reordering constants silently changes the meaning of existing rows."
  },
  {
   "q": "Formatting 30 December 2024 with <code>YYYY-MM-dd</code> prints what?",
   "a": "2025-12-30, because YYYY is the week-based year. Use yyyy."
  }
 ]
});
