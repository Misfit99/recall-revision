/* Generated from Core_Java_SDE2_Revision_Day2_v2_dark.pdf by tools/extract_revision_pdf.py */
Revision.addUnit({
 "subject": "core-java",
 "id": "day-2",
 "source": "Core_Java_SDE2_Revision_Day2_v2_dark.pdf",
 "label": "Day 2",
 "title": "Collections, HashMap, ConcurrentHashMap, Generics",
 "tagline": "Know each structure's insides well enough to predict its cost, and to predict how it fails.",
 "topics": "Collections · HashMap · TreeMap · Iterators · ConcurrentHashMap · Generics",
 "cards": [
  {
   "id": "2.0",
   "title": "Words this day uses (read once, then skip)",
   "blocks": [
    {
     "type": "recall",
     "html": "Several cards below talk about threads and locks before Day 4 teaches them properly, and a few words have more than one meaning. This box gives you just enough of each to read today&#x27;s cards."
    },
    {
     "type": "p",
     "html": "<strong>Thread-safe.</strong> A class is thread-safe if several threads can call it at the same time and it still behaves correctly. HashMap is not: two threads calling <code>put</code> together can lose an entry.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Lock, and <code>synchronized</code> on an object.</strong> Every Java object can act as a lock. <code>synchronized (obj) { ... }</code> means: only one thread at a time may run code that is locked on that same <code>obj</code>; any other thread that arrives waits at the door until the first one leaves the block. A <code>synchronized</code> method does the same, using <code>this</code> as the lock. Even with one thread, taking and releasing a lock costs a little extra work on every call.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Atomic.</strong> An operation is atomic if no other thread can get in the middle of it: it happens completely or not at all, as one step.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Check-then-act race (the picture to remember).</strong> Thread A checks &quot;is key k absent?&quot; and gets yes. Before A puts, Thread B also checks and also gets yes. Now both put, and one value silently overwrites the other. Each call was safe on its own; the gap between the check and the act is the bug.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>&quot;Serialized&quot; in this sheet</strong> means &quot;forced to run one at a time, in a line&quot;, not Java serialization (<code>Serializable</code>).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Three meanings of &quot;heap&quot;.</strong> (1) The JVM heap: the memory area where all objects live. (2) A binary heap: a tree-shaped data structure where the smallest item is on top (PriorityQueue, card 2.2). (3) Heap pollution: a variable of a generic type pointing at an object of the wrong type (card 2.10). Same word, three unrelated ideas.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Red-black tree.</strong> A sorted binary tree that keeps itself balanced as items are added and removed, so finding, adding and removing are always O(log n). TreeMap is one, and HashMap uses one for crowded buckets.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Invariant and covariant.</strong> Covariant means &quot;if Integer is a Number, then an Integer[] counts as a Number[]&quot; (arrays work this way). Invariant means that relationship does not carry over: a <code>List&lt;Integer&gt;</code> is not a <code>List&lt;Number&gt;</code> (generics work this way).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>View.</strong> A view is a live window onto another collection&#x27;s data, not a copy. Changes made through the original show up in the view (and often the other way round).",
     "bullet": true
    }
   ]
  },
  {
   "id": "2.1",
   "title": "The four families, ArrayList and LinkedList",
   "blocks": [
    {
     "type": "recall",
     "html": "Java&#x27;s collections come in four families. A List keeps items in positions (index 0, 1, 2...). A Set keeps only unique items. A Queue or Deque hands items out in a fixed order (first-in-first-out, or by priority). A Map stores key-to-value pairs; Map is not a <code>Collection</code> at all, it is a separate hierarchy. ArrayList, the most used List, is just an <code>Object[]</code> array plus a <code>size</code> counter."
    },
    {
     "type": "p",
     "html": "<strong>How ArrayList grows.</strong> <code>new ArrayList&lt;&gt;()</code> starts with an empty internal array. The first <code>add</code> gives it room for 10 items. When the array is full, ArrayList creates a new array 1.5 times bigger (<code>old + (old &gt;&gt; 1)</code>) and copies everything across with <code>Arrays.copyOf</code>. It never shrinks by itself; <code>trimToSize()</code> does that on request.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>size()</code> is not capacity.</strong> <code>size()</code> is how many items you added. Capacity is how many slots the internal array has. If you know you will add about n items, <code>new ArrayList&lt;&gt;(n)</code> creates the right capacity once and avoids repeated grow-and-copy.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Costs.</strong> <code>get(i)</code> and <code>set(i)</code> are O(1), because they index straight into the array. Adding at the end is amortized O(1): usually instant, occasionally a copy, which averages out to constant time. Adding or removing in the middle is O(n), because every later item must shift one slot. <code>contains</code> is O(n), because it calls <code>equals</code> on items one by one.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why LinkedList is almost never the right choice.</strong> Every item lives in its own node object holding the item plus two pointers, so it uses several times more memory. The nodes are scattered around the JVM heap. The CPU loads memory in small blocks, so an array&#x27;s neighbouring items arrive together, while linked nodes each need a separate trip to memory (this is what &quot;poor cache locality&quot; means). <code>get(i)</code> is O(n), because it has to walk node by node. Even its famous O(1) middle insert first needs an O(n) walk to reach the middle. In practice ArrayList (for lists) and ArrayDeque (for queues) beat it.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "On a <code>List&lt;Integer&gt;</code>, <code>list.remove(1)</code> removes the item at index 1, not the value 1, because <code>remove(int index)</code> matches an <code>int</code> argument without boxing (overload phase 1, Day 1 card 1.2). To remove the value, write <code>list.remove(Integer.valueOf(1))</code>."
    },
    {
     "type": "sayit",
     "html": "ArrayList is a resizable array: O(1) random access, amortized O(1) appends, growth by 1.5 times with an array copy, and O(n) inserts and removes in the middle. I pre-size it when I know the count. LinkedList almost never wins in practice because of node overhead, poor cache locality and O(n) access."
    }
   ]
  },
  {
   "id": "2.2",
   "title": "ArrayDeque and PriorityQueue",
   "blocks": [
    {
     "type": "recall",
     "html": "ArrayDeque is a resizable circular array that adds and removes at both ends in O(1), and it does not allow nulls. It is the default choice for both a stack and a queue. PriorityQueue is a binary min-heap stored in an array: it always hands out the smallest item first; <code>offer</code> and <code>poll</code> are O(log n) and <code>peek</code> is O(1)."
    },
    {
     "type": "p",
     "html": "<strong>Circular array, in plain words.</strong> ArrayDeque keeps a <code>head</code> index and a <code>tail</code> index into its array. When the tail reaches the end of the array, it wraps around to slot 0 if there is free space, so neither end ever needs to shift items. When the array is truly full, it grows: it doubled in Java 8; since Java 9 it roughly doubles while small and grows by 50% once its capacity reaches 64.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why no nulls in ArrayDeque.</strong> <code>poll()</code> and <code>peek()</code> return null to mean &quot;the deque is empty&quot;. If null were allowed as an item, you could not tell an empty deque from a deque whose next item is null.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Use ArrayDeque instead of the old classes.</strong> <code>Stack</code> extends <code>Vector</code> (an old, fully synchronized list, card 2.9), so every method takes a lock, which costs time even with one thread, and it exposes list methods that break the stack idea. <code>LinkedList</code> works as a queue, but has the node overhead from card 2.1. So use <code>Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();</code> with <code>push</code>/<code>pop</code>, and <code>Queue&lt;Integer&gt; q = new ArrayDeque&lt;&gt;();</code> with <code>offer</code>/<code>poll</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>How a heap sits in an array.</strong> The smallest item is at index 0. For the item at index i, its children are at 2i+1 and 2i+2, and its parent is at (i−1)/2. <code>offer</code> puts the new item at the end and swaps it upward while it is smaller than its parent (O(log n)). <code>poll</code> takes index 0, moves the last item to the top and swaps it downward (O(log n)). Building a heap from a whole collection with <code>new PriorityQueue&lt;&gt;(collection)</code> is O(n), not O(n log n), because most items sit near the bottom of the tree and need only a swap or two; <code>addAll</code> offers items one by one, so it is O(n log n).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Max-heap.</strong> For the largest item first, pass a comparator: <code>new PriorityQueue&lt;&gt; (Comparator.reverseOrder())</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Fintech example: an order book.</strong> A <code>TreeMap&lt;price, ArrayDeque&lt;Order&gt;&gt;</code> (TreeMap keeps keys sorted, card 2.5) gives the best price level in O(log L), where L is the number of price levels: for asks (sellers) the best price is the lowest, <code>firstKey()</code>; for bids (buyers) it is the highest, <code>lastKey()</code>. Meanwhile the ArrayDeque inside each level keeps orders at the same price in arrival order (FIFO).",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "Iterating over a PriorityQueue, or printing it, does not give sorted order. Only the head (index 0) is guaranteed to be the smallest; the rest is in heap order. To get everything in order, <code>poll()</code> repeatedly."
    },
    {
     "type": "trap",
     "html": "PriorityQueue is not stable: two items with equal priority can come out in any order. If arrival order matters (same-price orders), add a sequence number as a tie-breaker in the comparator. Also, <code>contains</code> and <code>remove(Object)</code> are O(n), and it is not thread-safe (use <code>PriorityBlockingQueue</code> across threads)."
    },
    {
     "type": "sayit",
     "html": "ArrayDeque is a circular resizable array with O(1) operations at both ends and no nulls, so it&#x27;s my default stack and queue. PriorityQueue is an array-backed binary min-heap: O(log n) offer and poll, O(1) peek, iteration not sorted, not stable, so I add a sequence tie-breaker when order of arrival matters."
    }
   ]
  },
  {
   "id": "2.3",
   "title": "HashMap internals",
   "blocks": [
    {
     "type": "recall",
     "html": "HashMap turns the key&#x27;s hashCode into a bucket number and stores the entry in that bucket. It starts with 16 buckets (this bucket count is called its capacity) and doubles the number of buckets once the number of entries goes past 75% of the number of buckets. A crowded bucket turns into a small red-black tree, but only when the table already has at least 64 buckets."
    },
    {
     "type": "p",
     "html": "<strong>How a bucket is picked.</strong> HashMap first mixes the key&#x27;s hashCode: <code>h ^ (h &gt;&gt;&gt; 16)</code>. This folds the top 16 bits into the bottom 16, because the bucket index uses only the low bits; without it, keys that differ only in their high bits would all collide. The index is then <code>hash &amp; (n − 1)</code>. That works like <code>hash % n</code> but faster, and it is only correct because the bucket count n is always a power of 2: with 16 buckets, <code>n − 1</code> is binary 1111, so <code>&amp;</code> simply keeps the last 4 bits of the hash, which is a number from 0 to 15.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>One real example.</strong> Take hashCode 123456789, which is hex 0x075BCD15. Shift right by 16 (<code>&gt;&gt;&gt;</code> is the unsigned shift) to get 0x075B, and XOR (<code>^</code>) it into the original: 0x075BCA4E. Keep the last 4 bits: 0xE, so bucket 14. Without the mixing, the last 4 bits of 0x075BCD15 would give bucket 5; the mixing let the high bits influence the bucket. On a resize to 32 buckets, HashMap tests the bit worth 16 in the mixed hash: here it is 0, so the entry stays in bucket 14; if it were 1, the entry would move to 14 + 16 = 30.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What <code>put</code> does, step by step.</strong> It computes the bucket. It walks the entries already in that bucket, and for each one it compares the stored hash first and then the key with <code>equals</code>. If it finds an equal key, it replaces that entry&#x27;s value. If not, it appends a new entry at the end of the chain. Then it checks whether <code>size</code> has gone past <code>capacity × 0.75</code> (0.75 is called the load factor, and the result, 12 for 16 buckets, is the threshold). So the 12th entry fits, and adding the 13th triggers the resize.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What resize does.</strong> It doubles the bucket count and moves every entry. Because the count doubled, each entry either stays at its old index i or moves to exactly i + oldCapacity. HashMap decides which by testing one extra bit of the hash, so it never recomputes hash codes.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>When a bucket becomes a tree.</strong> When a <code>put</code> adds to a chain that already holds 8 entries (so the new entry is the 9th), HashMap converts that bucket into a red-black tree, but only if the table has at least 64 buckets. If the table is smaller, it resizes instead, because spreading the entries over more buckets is the better fix. It turns back into a plain chain when it gets small again: during a resize, a half with 6 or fewer entries becomes a chain; after removals, HashMap decides from the tree&#x27;s shape.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why the tree exists.</strong> If many keys collide, because of a bad hashCode or an attacker sending crafted keys (hash flooding), one bucket becomes a long chain and lookups in it become O(n). A red-black tree keeps lookups in that bucket at about O(log n). (This works best when the colliding keys have different full hash values or implement Comparable; keys with identical hashes that are not Comparable can still cost O(n).)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Small facts interviewers check.</strong> The bucket array is created on the first <code>put</code>, not in the constructor. One null key is allowed and always goes to bucket 0, and any number of values may be null. To hold about 1,000 entries, you need 1000 / 0.75 ≈ 1334 buckets or more; <code>new HashMap&lt;&gt; (1500)</code> rounds up to 2048 buckets (threshold 1536), so it never resizes. The default map would resize at entries 13, 25, 49, 97, 193, 385 and 769, which is 7 resizes; since Java 19, <code>HashMap.newHashMap(1000)</code> does that sizing arithmetic for you.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "<strong>The Java 7 infinite loop.</strong> In Java 7, a resize inserted each moved entry at the head of its new chain, so chains came out reversed. If two threads resized the same map at the same time, they could link two entries to each other (A → B → A). Any later <code>get</code> on that bucket then looped forever at 100% CPU. Java 8 keeps entries in their original order while splitting a chain, so that particular loop is gone. But HashMap is still not thread-safe: two threads writing at once can lose a <code>put</code> or leave <code>size</code> wrong. Use ConcurrentHashMap when more than one thread writes."
    },
    {
     "type": "sayit",
     "html": "put takes the key&#x27;s hashCode, mixes the high bits into the low bits, and masks it to a bucket index. It walks that bucket comparing hash and then equals, replaces or appends, and doubles the table once it&#x27;s more than 75% full. Since Java 8 a bucket that gets a 9th entry becomes a red-black tree if the table has at least 64 buckets, which keeps the worst case at O(log n)."
    }
   ]
  },
  {
   "id": "2.4",
   "title": "Why HashMap.get() returns null for a key you put",
   "blocks": [
    {
     "type": "recall",
     "html": "There are five common causes. The key class does not override <code>hashCode</code>. It does not override <code>equals</code>. The key object was changed after <code>put</code>. The key was boxed to a different type (a <code>Map&lt;Long, ...&gt;</code> queried with an <code>int</code> such as <code>map.get(42)</code>). Or two String keys differ in case or whitespace."
    },
    {
     "type": "p",
     "html": "<strong>Missing <code>hashCode</code> or <code>equals</code></strong> (Day 1 card 1.7). Without <code>hashCode</code>, two equal keys get different identity hash codes (the default <code>Object.hashCode</code>, which is per object) and the lookup never matches. Without <code>equals</code>, the lookup reaches the right bucket, but the default <code>equals</code> compares references, so a new but equal key never matches.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The key was changed after <code>put</code> (a mutable key).</strong> The bucket was chosen from the hash code at the moment of <code>put</code>. If you then change a field that <code>hashCode</code> uses, the entry is still sitting in the old bucket, while <code>get</code> computes the new hash and looks somewhere else. The entry is orphaned: <code>size()</code> counts it and iteration shows it, but no <code>get</code> can find it. Making a copy before <code>put</code> does not help unless the copy is never changed, because HashMap stores your reference, not a snapshot. The real fix is immutable keys.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Long versus Integer.</strong> <code>get</code> takes an <code>Object</code>. In a <code>Map&lt;Long, String&gt;</code>, calling <code>map.get(42)</code> boxes 42 into an <code>Integer</code>, not a <code>Long</code>. <code>Integer.equals(Long)</code> is always false, so the result is null, and the compiler does not warn you. Write <code>map.get(42L)</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>String keys.</strong> &quot;ABC&quot; and &quot;abc &quot; are different keys. Normalize keys (trim, lowercase) before both <code>put</code> and <code>get</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Keys that are always safe:</strong> String, Integer, Long, UUID, LocalDate, enums, and records whose components are themselves immutable.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "get can miss for five reasons: no hashCode override, no equals override, a key mutated after put so the entry is stranded in its old bucket, a boxing mismatch like Integer versus Long, or String keys that differ in case or whitespace. I use immutable keys, and normalize String keys."
    }
   ]
  },
  {
   "id": "2.5",
   "title": "LinkedHashMap, TreeMap, the Sets, and the immutable factories",
   "blocks": [
    {
     "type": "recall",
     "html": "LinkedHashMap is a HashMap plus a doubly-linked list running through all its entries, so it remembers an order: insertion order by default, or access order if you ask. TreeMap keeps its keys sorted in a red-black tree, so its operations are O(log n), and it offers range lookups such as <code>floorKey</code>, <code>ceilingKey</code>, <code>headMap</code> and <code>subMap</code>."
    },
    {
     "type": "p",
     "html": "<strong>An LRU cache in a few lines</strong> (LRU = least recently used; the code is below). Create <code>new LinkedHashMap&lt;&gt;(capacity, 0.75f, true)</code>; 0.75f is the load factor from card 2.3, and the <code>true</code> switches on access order, so every <code>get</code> moves that entry to the end of the list. Then override <code>removeEldestEntry</code> to return <code>size() &gt; capacity</code>. After each <code>put</code> that inserts a new key, the map asks that method whether to drop the eldest entry (the least recently used one). It is not thread-safe, so for shared use wrap it with <code>Collections.synchronizedMap</code> (card 2.9) or guard it with a lock.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>TreeMap range lookups, with an example.</strong> For a map of exchange rates by date, <code>floorKey(today)</code> gives the latest date on or before today, <code>ceilingKey(x)</code> the smallest key on or after x, and <code>subMap(from, to)</code> a view of every entry from <code>from</code> (included) up to <code>to</code> (excluded). A HashMap cannot answer any of these without scanning everything.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The Sets are built on Maps.</strong> HashSet, LinkedHashSet and TreeSet store your items as keys in a HashMap, LinkedHashMap or TreeMap respectively, with one shared dummy object as every value. So they inherit the map&#x27;s speed, ordering and rules.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>TreeMap and TreeSet decide &quot;same key&quot; using <code>compareTo</code> or the Comparator, not <code>equals</code>.</strong> If the comparison returns 0, the second key counts as a duplicate, even if <code>equals</code> would say false. TreeMap with natural ordering also throws a NullPointerException for a null key, because it has to call <code>compareTo</code> on it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>List.of</code>, <code>Set.of</code> and <code>Map.of</code> (Java 9+).</strong> They create collections that cannot be changed at all: <code>add</code>, <code>remove</code> and <code>set</code> throw <code>UnsupportedOperationException</code>. They reject null items with a NullPointerException at creation, and even <code>List.of(1).contains(null)</code> throws one. <code>Set.of(1, 1)</code> and duplicate keys in <code>Map.of</code> throw <code>IllegalArgumentException</code>. <code>Map.of</code> takes up to 10 key-value pairs; beyond that, use <code>Map.ofEntries</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>Arrays.asList(array)</code> is different again.</strong> It is a fixed-size list that writes through to the array: <code>set</code> works and changes the array too, but <code>add</code> and <code>remove</code> throw <code>UnsupportedOperationException</code>.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "class LruCache<K, V> extends LinkedHashMap<K, V> {\n    private final int capacity;\n    LruCache(int capacity) { super(16, 0.75f, true); this.capacity = capacity; }   // true = access order\n    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {\n        return size() > capacity;              // called after each new key is inserted\n    }\n}"
    },
    {
     "type": "trap",
     "html": "<strong>BigDecimal in Sets.</strong> <code>new BigDecimal(&quot;1.0&quot;).equals(new BigDecimal(&quot;1.00&quot;))</code> is false, because <code>equals</code> also compares the scale (the number of decimal places). But <code>compareTo</code> returns 0, because the values are numerically equal. So a HashSet (which uses equals) keeps both, while a TreeSet (which uses compareTo) keeps only one. In fintech code, normalize the scale with <code>setScale</code> or <code>stripTrailingZeros</code> before using amounts as keys."
    },
    {
     "type": "sayit",
     "html": "LinkedHashMap adds a linked list to HashMap to keep insertion or access order, which with removeEldestEntry gives a simple LRU cache. TreeMap is a red-black tree with O(log n) sorted operations and range queries, and it treats compareTo returning 0 as the same key. The Java 9 factories are fully immutable and reject nulls and duplicates."
    }
   ]
  },
  {
   "id": "2.6",
   "title": "Iterators: fail-fast, snapshot and weakly consistent",
   "blocks": [
    {
     "type": "recall",
     "html": "There are three kinds of iterator. A fail-fast iterator (ArrayList, HashMap) throws <code>ConcurrentModificationException</code> on its next <code>next()</code> if the collection was structurally changed by anyone other than the iterator itself. A snapshot iterator (CopyOnWriteArrayList) walks over a frozen copy, so it never sees later changes and never throws. A weakly consistent iterator (ConcurrentHashMap) never throws, returns every element that existed when it was created (and was not removed since) exactly once, and may or may not show changes made while it runs."
    },
    {
     "type": "p",
     "html": "<strong>How fail-fast works.</strong> The collection keeps a counter called <code>modCount</code>, which goes up on every structural change (add, remove, clear). Replacing a value is not structural: <code>list.set(i, x)</code>, or <code>map.put(k, v)</code> on a key that already exists, does not change <code>modCount</code>. The iterator records <code>modCount</code> when it is created. Each <code>next()</code> compares the two numbers, and if they differ it throws. Note that <code>modCount</code> and <code>size</code> are different counters: <code>size</code> is how many items there are, <code>modCount</code> is how many structural changes there have been.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Removing items safely while looping.</strong> Use the iterator&#x27;s own <code>it.remove()</code>, which updates the iterator&#x27;s recorded count as well. Or use <code>list.removeIf(x -&gt; ...)</code>. Never call <code>list.remove(x)</code> inside a for-each loop.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A ConcurrentModificationException is usually single-threaded.</strong> Most of the time it means your own loop changed the collection it was walking. Fail-fast is a best-effort bug detector, not a thread-safety guarantee: with two threads, the exception may or may not appear.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>CopyOnWriteArrayList.</strong> Every write (add, set, remove) copies the whole array, which is O(n), and readers never lock. That only pays off for lists that are read constantly and changed rarely, such as event listeners or configuration. Its iterator does not support <code>remove()</code>.",
     "bullet": true
    },
    {
     "type": "trap",
     "html": "Removing the second-to-last element of an ArrayList inside a for-each loop throws nothing, which surprises people. After the removal, the iterator&#x27;s position (<code>cursor</code>) equals the new <code>size</code>, and <code>hasNext()</code> is simply <code>cursor != size</code>. So <code>hasNext()</code> returns false, the loop ends quietly, and the last element is never visited. Trace it on [a, b, c]: after returning b, the cursor (the index of the next item to return) is 2. You remove b, so size becomes 2. <code>hasNext()</code> checks 2 != 2, which is false, and c is skipped. Removing any other element makes the next <code>next()</code> throw."
    },
    {
     "type": "sayit",
     "html": "ArrayList and HashMap iterators are fail-fast: they compare modCount and throw ConcurrentModificationException on the next call to next, usually because the same thread modified the collection in its loop, and the fix is iterator.remove or removeIf. CopyOnWrite collections iterate over a snapshot, and concurrent collections like ConcurrentHashMap have weakly consistent iterators that never throw."
    }
   ]
  },
  {
   "id": "2.7",
   "title": "Comparable vs Comparator, and how Java sorts",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>Comparable</code> gives a class its one natural order, through its own <code>compareTo</code> method (the interface is in <code>java.lang</code>). A <code>Comparator</code> is a separate object that defines an extra order from outside the class, through <code>compare</code> (it is in <code>java.util</code>), so you can have as many orders as you need."
    },
    {
     "type": "p",
     "html": "<strong>Building a comparator by chaining.</strong> <code>Comparator.comparing(Emp::getDept).thenComparing(Emp::getSalary, Comparator.reverseOrder()).thenComparingInt(Emp::getId)</code> sorts by department, then by salary from highest to lowest, then by id. For a key that may be null, pass a null-safe comparator as the second argument: <code>Comparator.comparing(Emp::getDept, Comparator.nullsLast(Comparator.naturalOrder()))</code> puts employees with no department at the end.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The contract.</strong> If a is less than b, then b must be greater than a (anti-symmetry). If a &lt; b and b &lt; c, then a &lt; c (transitivity). And if compare(a, b) returns 0, then a and b must compare the same way against every other item c. Being consistent with <code>equals</code> (compare returns 0 exactly when <code>equals</code> is true) is strongly recommended, because sorted collections use compare to decide what is a duplicate (card 2.5).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>How Java sorts objects: TimSort.</strong> <code>List.sort</code>, <code>Collections.sort</code> and <code>Arrays.sort</code> on an object array use TimSort, a merge sort tuned for data that is already partly sorted. It is O(n log n), and it is stable: items that compare equal keep their original relative order. So if you sort transactions by time, and then sort the result by account, transactions of the same account stay in time order, because the second sort does not disturb items it considers equal (same account). <code>Arrays.sort</code> on a primitive array (<code>int[]</code>) uses a dual-pivot quicksort instead; stability doesn&#x27;t matter there, because equal ints are indistinguishable.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A broken comparator can make TimSort throw.</strong> If a comparator breaks the contract (for example by returning random results, or being non-transitive), TimSort may throw <code>IllegalArgumentException: Comparison method violates its general contract!</code>.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "Comparator<Integer> bad  = (a, b) -> a - b;              // looks fine, but can overflow\nbad.compare(Integer.MIN_VALUE, 1)   // MIN_VALUE - 1 wraps around to MAX_VALUE: a positive number,\n                                    // so it claims MIN_VALUE > 1, which is wrong\nComparator<Integer> good = Integer::compare;              // or Comparator.naturalOrder()"
    },
    {
     "type": "trap",
     "html": "Never write a comparator as <code>a - b</code>. When the numbers are far apart, the subtraction overflows the int range and the sign flips, so the order comes out wrong, often only in production with extreme values. Use <code>Integer.compare(a, b)</code>, <code>Long.compare</code>, or <code>Comparator.comparingInt</code>."
    },
    {
     "type": "sayit",
     "html": "Comparable is the class&#x27;s single natural order via compareTo; Comparator gives any number of external orders that I compose with comparing and thenComparing. Object sorting uses TimSort, which is stable and O(n log n). I never write a minus b in a comparator because it overflows; I use Integer.compare."
    }
   ]
  },
  {
   "id": "2.8",
   "title": "ConcurrentHashMap",
   "blocks": [
    {
     "type": "recall",
     "html": "ConcurrentHashMap (Java 8 and later) lets many threads read and write at once by having each write lock only the one bucket (bin) it touches, so writes to different bins run in parallel. Reads take no lock at all. A write into an empty bin uses a single CAS, with no lock. A write into a bin that already has entries locks just that bin&#x27;s first node with <code>synchronized</code>. It allows no null keys and no null values. For check-then-act logic, use its atomic methods: <code>compute</code>, <code>merge</code>, <code>putIfAbsent</code>, <code>computeIfAbsent</code>."
    },
    {
     "type": "p",
     "html": "<strong>CAS, in one line.</strong> CAS (compare-and-swap) is a single CPU instruction meaning &quot;set this slot to X, but only if it still holds what I last saw&quot;. If another thread got there first, the CAS fails and the code retries. So filling an empty bin needs no lock at all.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why reads need no lock.</strong> The table reference and each entry&#x27;s value and next-pointer are <code>volatile</code> fields, and the array slots themselves are read with the same volatile guarantee through special memory operations. Together this guarantees that a reader sees a fully written entry. (<code>volatile</code> is covered properly on Day 4.)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Each call is atomic; a sequence of calls is not.</strong> <code>if (!map.containsKey(k)) map.put(k, v);</code> is a race even on ConcurrentHashMap: two threads can both see &quot;absent&quot; and both put. Write <code>map.putIfAbsent(k, v)</code> or <code>map.computeIfAbsent(k, key -&gt; load(key))</code> instead.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A per-key counter.</strong> <code>map.merge(k, 1, Integer::sum)</code> atomically adds 1 to the count for k, or inserts 1 if k is absent. Two separate atomic calls, such as <code>get</code> followed by <code>put</code>, together are not atomic (the check-then-act picture in card 2.0).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why nulls are banned.</strong> In a shared map, <code>get(k)</code> returning null must clearly mean &quot;k is absent&quot;. If null values were allowed, you would need a follow-up <code>containsKey(k)</code> to tell the two cases apart, and another thread could change the map between the two calls.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Size and iteration.</strong> Iterators are weakly consistent (card 2.6). <code>size()</code> is only an estimate while other threads are writing; <code>mappingCount()</code> returns the same estimate as a <code>long</code>. Internally the count is spread over several counter cells (the same idea as LongAdder, Day 4) so that writers don&#x27;t all fight over one counter.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Resizing.</strong> When the table grows, threads that try to write into a bin that has already been moved help move the remaining bins, instead of waiting.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "",
      "<strong>Java 7 ConcurrentHashMap</strong>",
      "<strong>Java 8+ ConcurrentHashMap</strong>"
     ],
     "rows": [
      [
       "What gets locked",
       "A Segment (a sub-map that is also a lock object, a ReentrantLock, Day 4); 16 segments by default, fixed when the map is created",
       "One bin at a time: CAS if it is empty, otherwise synchronized on its first node"
      ],
      [
       "Most writers at once",
       "About the number of segments",
       "About the number of bins"
      ],
      [
       "size()",
       "Tries without locking, then locks every segment",
       "Adds up the counter cells; never locks"
      ],
      [
       "Bad hashCode",
       "Long chain, O(n)",
       "Bin becomes a tree, O(log n)"
      ]
     ]
    },
    {
     "type": "trap",
     "html": "Keep the function you pass to <code>computeIfAbsent</code> or <code>compute</code> short, and never let it change the same map. It runs while the bin is locked, so slow work blocks other writers to that bin, and modifying the map inside it can throw <code>IllegalStateException: Recursive update</code> (Java 9+) or even hang."
    },
    {
     "type": "sayit",
     "html": "ConcurrentHashMap locks per bin instead of per map: lock-free reads, a CAS to fill an empty bin, and synchronized on the bin&#x27;s head node otherwise. For check-then-act I use putIfAbsent, computeIfAbsent or merge, because two separate atomic calls aren&#x27;t atomic together. It bans nulls so that get returning null unambiguously means absent."
    }
   ]
  },
  {
   "id": "2.9",
   "title": "Collections.synchronizedMap and Hashtable",
   "blocks": [
    {
     "type": "recall",
     "html": "Both protect the whole map with one single lock. That makes each individual method call atomic, but a sequence of calls is still not atomic, and iterating over them needs a manual <code>synchronized (map) { ... }</code> block, or you can get a ConcurrentModificationException."
    },
    {
     "type": "p",
     "html": "<strong><code>Collections.synchronizedMap(new HashMap&lt;&gt;())</code></strong> wraps the map, and every method locks on the wrapper object. Only one thread at a time can read or write, so under load the threads queue up behind that one lock.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why iteration needs the manual lock.</strong> Iterating is many calls (<code>hasNext</code>, <code>next</code>, <code>next</code>...). The wrapper locks each call separately, so another thread can modify the map between two of them. Holding <code>synchronized (map)</code> for the whole loop blocks writers for its duration.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Hashtable</strong> is from Java 1.0. Every method is synchronized, it allows no null keys or values, and it is legacy (<code>Properties</code> still extends it). <code>Vector</code> is the list equivalent; it also synchronizes everything and doubles its capacity when it grows.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What to use today.</strong> ConcurrentHashMap for a map shared between threads; a plain HashMap when only one thread uses it.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "synchronizedMap and Hashtable put one lock around the whole map, so every operation runs one at a time, compound actions are still racy, and iteration needs an explicit synchronized block. ConcurrentHashMap scales much better because it locks per bin and has lock-free reads."
    }
   ]
  },
  {
   "id": "2.10",
   "title": "Generics: invariance, bounds, PECS and the four kinds of List",
   "blocks": [
    {
     "type": "recall",
     "html": "Generics are invariant: a <code>List&lt;Dog&gt;</code> is not a <code>List&lt;Animal&gt;</code>, even though a Dog is an Animal. Wildcards let you loosen that safely. The rule is PECS, Producer Extends, Consumer Super: if you only read from the collection (it produces values for you), use <code>? extends T</code>. If you only put into it (it consumes your values), use <code>? super T</code>. If you do both, use exactly <code>T</code>."
    },
    {
     "type": "p",
     "html": "<strong>Why invariance is necessary.</strong> If <code>List&lt;Dog&gt;</code> were a <code>List&lt;Animal&gt;</code>, you could write <code>List&lt;Animal&gt; animals = dogs; animals.add(new Cat());</code>. Now a Cat would be sitting in a list of Dogs, and the next <code>Dog d = dogs.get(0)</code> would fail. Invariance makes the compiler reject the first line.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>? extends</code> in practice.</strong> A <code>List&lt;? extends Number&gt;</code> can be a <code>List&lt;Integer&gt;</code> or a <code>List&lt;Double&gt;</code>. Everything you read from it is a Number, so reading is safe. But you cannot add anything except null, because the compiler doesn&#x27;t know which list it really is (adding a Double to a <code>List&lt;Integer&gt;</code> would be wrong).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>? super</code> in practice.</strong> A <code>List&lt;? super Integer&gt;</code> can be a <code>List&lt;Integer&gt;</code>, a <code>List&lt;Number&gt;</code> or a <code>List&lt;Object&gt;</code>. Adding an Integer is always safe for all three. But reads come back only as <code>Object</code>, because that is all the compiler can promise.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>PECS in the JDK.</strong> <code>Collections.copy(List&lt;? super T&gt; dest, List&lt;? extends T&gt; src)</code> reads from src and writes into dest. <code>Stream.map</code> takes a <code>Function&lt;? super T, ? extends R&gt;</code>: the function must accept T (or any parent of T) and may return R (or any child of R), so for a <code>Stream&lt;Integer&gt;</code> you may pass a function written for Numbers. <code>forEach</code> takes a <code>Consumer&lt;? super T&gt;</code> for the same reason.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bounded type parameters.</strong> <code>&lt;T extends Comparable&lt;T&gt;&gt; T max(List&lt;T&gt; list)</code> says that T must be something comparable to itself. A type parameter can have several bounds (<code>&lt;T extends Number &amp; Comparable&lt;T&gt;&gt;</code>). <code>super</code> is allowed only on wildcards, never on a type parameter.",
     "bullet": true
    },
    {
     "type": "table",
     "head": [
      "<strong>Declared as</strong>",
      "<strong>Which lists it accepts</strong>",
      "<strong>What you can add</strong>",
      "<strong>What you read back</strong>"
     ],
     "rows": [
      [
       "<code>List</code> (raw type)",
       "Any list",
       "Anything, with only an unchecked warning; the bad item fails later, with a ClassCastException where it is read",
       "Object"
      ],
      [
       "<code>List&lt;?&gt;</code>",
       "Any list",
       "Nothing (only null)",
       "Object"
      ],
      [
       "<code>List&lt;Object&gt;</code>",
       "Only a <code>List&lt;Object&gt;</code>, not a <code>List&lt;String&gt;</code>",
       "Anything",
       "Object"
      ],
      [
       "<code>List&lt;String&gt;</code>",
       "Only a <code>List&lt;String&gt;</code>",
       "Strings only",
       "String"
      ]
     ]
    },
    {
     "type": "trap",
     "html": "Raw types switch off the generic checks. Passing a <code>List&lt;String&gt;</code> to a method that takes a raw <code>List</code> lets that method add an Integer with only a warning. The program fails later, at a <code>String s = list.get(i)</code> line far away from the real bug. This hidden corruption is called heap pollution. Use <code>List&lt;?&gt;</code> when you mean &quot;any list&quot;."
    },
    {
     "type": "sayit",
     "html": "Generics are invariant, so List&lt;Dog&gt; isn&#x27;t a List&lt;Animal&gt;. I use PECS: extends when the collection produces values I read, super when it consumes values I add, and the exact type when I do both. List&lt;?&gt; accepts any list but lets me add nothing except null, while a raw List disables type checking and leads to heap pollution."
    }
   ]
  },
  {
   "id": "2.11",
   "title": "Type erasure, bridge methods and generic arrays",
   "blocks": [
    {
     "type": "recall",
     "html": "Generic type arguments are checked at compile time and then erased from objects and from the code that runs: every type parameter becomes its bound (Object if there is no bound), and the compiler inserts casts where needed. So at runtime <code>List&lt;String&gt;</code> and <code>List&lt;Integer&gt;</code> are the very same class, <code>List.class</code>."
    },
    {
     "type": "p",
     "html": "<strong>What erasure forbids.</strong> You cannot write <code>new T()</code> or <code>new T[n]</code>, because at runtime there is no T to create. You cannot write <code>obj instanceof List&lt;String&gt;</code> on an arbitrary object, because the runtime cannot check the <code>&lt;String&gt;</code> part. (Since Java 16 it is allowed when the type arguments are already proven by the declared type. For example, with <code>Collection&lt;String&gt; c</code>, the check <code>c instanceof List&lt;String&gt; l</code> only needs to test the List part at runtime, and it gives you a typed variable <code>l</code>.) You cannot overload <code>f(List&lt;String&gt;)</code> and <code>f(List&lt;Integer&gt;)</code>, because both erase to <code>f(List)</code>, a name clash. And a static field cannot use the class&#x27;s T, because there is one static field shared by every <code>Box&lt;String&gt;</code>, <code>Box&lt;Integer&gt;</code> and so on.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Bridge methods.</strong> When <code>class Money implements Comparable&lt;Money&gt;</code> defines <code>compareTo(Money m)</code>, the erased interface actually declares <code>compareTo(Object)</code>. So the compiler secretly adds a bridge method <code>compareTo(Object o)</code> that casts <code>o</code> to Money and calls your method. Without it, code such as <code>Collections.sort</code>, which calls <code>compareTo(Object)</code> through the Comparable interface, would find no matching method in Money. That is how polymorphism still works after erasure. You may see these bridge methods in stack traces and through reflection.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why generic arrays are banned.</strong> Arrays are covariant (card 2.0) and check their element type at runtime: <code>Number[] n = new Integer[1]; n[0] = 1.5;</code> compiles but throws <code>ArrayStoreException</code>. Generics are invariant and checked only at compile time, then erased. If <code>new List&lt;String&gt;[10]</code> were allowed, the array could not check its elements at runtime, and a wrong element would get in silently. So the compiler forbids it. Use a <code>List&lt;List&lt;String&gt;&gt;</code>, or <code>Array.newInstance(clazz, n)</code> when you really need an array.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Getting the generic type back at runtime (super type tokens).</strong> Erasure removes type arguments from objects (an <code>ArrayList&lt;String&gt;</code> object does not know about String), but declarations written in source, such as a class&#x27;s <code>extends</code> clause or a field&#x27;s declared type, keep their generic types as metadata in the class file, readable through reflection. Libraries such as Jackson need to know that you want a <code>List&lt;Order&gt;</code>, not just a List. <code>new TypeReference&lt;List&lt;Order&gt;&gt; () {}</code> creates an anonymous subclass whose declaration says <code>extends TypeReference&lt;List&lt;Order&gt;&gt;</code>, and that declaration survives. The library reads it with <code>getGenericSuperclass()</code>. That is why those odd <code>{}</code> braces are required.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>@SafeVarargs</code>.</strong> A varargs parameter of a generic type (<code>List&lt;T&gt;... lists</code>) secretly creates a generic array. You cannot write <code>new List&lt;T&gt;[n]</code> yourself, but Java allows this hidden one, with only a warning, because banning it would break useful methods such as <code>Arrays.asList(T... a)</code>. The warning is about possible heap pollution. If your method only reads from that array and never stores it or hands it out, you can promise that with <code>@SafeVarargs</code>. It is allowed only on methods that cannot be overridden (static, final and, since Java 9, private methods) and on constructors, because a subclass override could break the promise.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Generics are erased after compile-time checking: type parameters become their bounds and the compiler inserts casts and bridge methods, so List&lt;String&gt; and List&lt;Integer&gt; share one runtime class. That&#x27;s why I can&#x27;t create new T or generic arrays, can&#x27;t instanceof a parameterized type, and can&#x27;t overload on type arguments. To recover a generic type at runtime, libraries use a super type token like Jackson&#x27;s TypeReference."
    }
   ]
  }
 ],
 "quiz": [
  {
   "q": "With default settings, when does a HashMap resize, and when does a bucket become a tree?",
   "a": "It doubles when size passes capacity × 0.75 (13th entry for 16 buckets). A bucket becomes a red-black tree when a put adds to a chain already holding 8 entries and the table has at least 64 buckets; below 64 it resizes instead."
  },
  {
   "q": "<code>map.get(42)</code> on a <code>Map&lt;Long, String&gt;</code> that contains the key 42L returns what, and why?",
   "a": "null. 42 is boxed to an Integer, and Integer.equals(Long) is always false. Write map.get(42L)."
  },
  {
   "q": "Why does ConcurrentHashMap reject null values?",
   "a": "So that get returning null unambiguously means absent. With nulls you would need a separate containsKey call, and another thread could change the map in between."
  },
  {
   "q": "You remove the second-to-last element of an ArrayList inside a for-each loop. What happens?",
   "a": "No exception. After the removal cursor equals size, so hasNext() returns false, the loop ends, and the last element is silently skipped."
  },
  {
   "q": "A method only reads Numbers from a list. Which parameter type should it take, and why?",
   "a": "<code>List&lt;? extends Number&gt;</code> (producer extends). It accepts a List&lt;Integer&gt; or a List&lt;Double&gt;, and you can read Numbers from it, but you can&#x27;t add to it."
  },
  {
   "q": "Why is <code>(a, b) -&gt; a - b</code> a bad comparator?",
   "a": "Subtraction can overflow for values far apart (for example Integer.MIN_VALUE - 1), the sign flips, and the order comes out wrong. Use Integer.compare."
  },
  {
   "q": "A HashSet and a TreeSet each get new BigDecimal(&quot;1.0&quot;) and new BigDecimal(&quot;1.00&quot;). What size is each?",
   "a": "HashSet 2 (equals compares scale, so they differ); TreeSet 1 (compareTo returns 0)."
  },
  {
   "q": "Why can&#x27;t you write <code>new T[10]</code> or <code>new List&lt;String&gt;[10]</code>?",
   "a": "Erasure removes T and String at runtime, so the array could not check its elements the way arrays normally do. A wrong element would get in silently, so the compiler forbids it."
  },
  {
   "q": "How do you turn LinkedHashMap into an LRU cache?",
   "a": "Create it with accessOrder = true (third constructor argument) and override removeEldestEntry to return size() &gt; capacity."
  },
  {
   "q": "You print a PriorityQueue holding 5, 1, 3. Is the output sorted?",
   "a": "Not necessarily. Only the head is guaranteed to be the smallest; iteration follows the heap&#x27;s array order. poll() repeatedly to get sorted order."
  },
  {
   "q": "Is <code>if (!map.containsKey(k)) map.put(k, v);</code> safe on a ConcurrentHashMap?",
   "a": "No. Each call is atomic, but the pair is not; two threads can both see absent and both put. Use putIfAbsent or computeIfAbsent."
  }
 ]
});
