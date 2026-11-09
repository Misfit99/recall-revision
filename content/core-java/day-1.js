/* Generated from Core_Java_SDE2_Revision_Day1_v2_dark.pdf by tools/extract_revision_pdf.py */
Revision.addUnit({
 "subject": "core-java",
 "id": "day-1",
 "source": "Core_Java_SDE2_Revision_Day1_v2_dark.pdf",
 "label": "Day 1",
 "title": "OOP, Strings, equals/hashCode, Immutability",
 "tagline": "Almost every trap on this day comes down to one question: is Java looking at the reference type or at the real object?",
 "topics": "OOP · Polymorphism · Constructors · String · equals/hashCode · Immutability",
 "cards": [
  {
   "id": "1.1",
   "title": "The four pillars of OOP",
   "blocks": [
    {
     "type": "recall",
     "html": "Encapsulation keeps an object&#x27;s data safe behind methods. Inheritance lets a class reuse and extend another class when there is a real IS-A relationship. Polymorphism lets one method call do the right thing for whichever subtype is actually there. Abstraction lets callers depend on what something does (a contract) instead of how one class does it."
    },
    {
     "type": "p",
     "html": "<strong>Encapsulation in practice.</strong> You make the fields <code>private</code> and only let them change through methods that check the rules. For example, a <code>BankAccount</code> keeps <code>balance</code> private, and <code>withdraw()</code> refuses to let it go below zero. If the field were public, any code anywhere could set it to −500 and nothing would stop it.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The four access levels, from tightest to loosest.</strong> <code>private</code> means only this class. No modifier (package-private) means any class in the same package. <code>protected</code> means the same package plus subclasses in other packages. <code>public</code> means everyone.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Inheritance rules.</strong> A class can extend only one class, but it can implement many interfaces. Every class ultimately extends <code>Object</code>. Constructors are never inherited; a subclass must declare its own and call the parent&#x27;s with <code>super(...)</code>. A <code>final</code> class, such as <code>String</code> or <code>Integer</code>, cannot be extended at all.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>When to use inheritance and when not to.</strong> Use inheritance only when the child truly <em>is a</em> kind of the parent (a <code>SavingsAccount</code> is a <code>BankAccount</code>). If you only want to reuse some code, prefer composition: hold the other object in a field and call it. Composition does not tie your class to the parent&#x27;s internal behaviour, so a change in the parent cannot silently break you (Effective Java, Item 18). The classic example: you extend <code>HashSet</code> and override both <code>add</code> and <code>addAll</code> to count how many items were added. But <code>HashSet.addAll</code> internally calls <code>add</code> for each item, so every item is counted twice. Your class broke because of a parent detail you could not see. If you had wrapped a <code>HashSet</code> in a field instead, your counting code would only see your own calls.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Abstraction in practice.</strong> Code that accepts a <code>List</code> works with an <code>ArrayList</code>, a <code>LinkedList</code>, or any future list, because it depends only on the <code>List</code> contract, not on one concrete class.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "Encapsulation protects state by hiding fields behind validating methods. Inheritance models a genuine IS-A relationship, and for plain code reuse I prefer composition. Polymorphism means the same call runs the subtype&#x27;s own behaviour at runtime. Abstraction means callers program against an interface or contract rather than a concrete class."
    }
   ]
  },
  {
   "id": "1.2",
   "title": "Polymorphism: the reference type and the object type",
   "blocks": [
    {
     "type": "recall",
     "html": "Java makes two separate decisions on every method call. The compiler looks at the reference type (the declared type of the variable) to decide which methods you are allowed to call and which overload to use. The JVM then looks at the real object at runtime to decide which override actually runs."
    },
    {
     "type": "p",
     "html": "<strong>The basic picture.</strong> In <code>Parent p = new Child();</code> the variable <code>p</code> has reference type <code>Parent</code> (the type written on the left, when the variable is declared), but the object it points to is a <code>Child</code>. When you call <code>p.show()</code>, and <code>Child</code> overrides <code>show()</code>, the <code>Child</code> version runs. This runtime choice is called dynamic dispatch. The JVM finds the right method through a per-class lookup table that maps each method to the code that should run (people call it the vtable; you only need the name, not the details).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What does not take part in overriding.</strong> Static methods are hidden, not overridden, so the reference type decides (card 1.3). Private methods are invisible to subclasses, so a same-named method in the child is a brand-new, unrelated method. Final methods cannot be overridden at all; trying is a compile error. Constructors are not inherited, so they cannot be overridden either.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Overloading</strong> means the same method name with different parameter lists in the same class (or inherited into it). The compiler picks one at compile time, using only the declared types of the arguments. A different return type alone is not enough to overload; that is a compile error.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>How the compiler picks an overload: three phases.</strong> In phase 1 it looks only for methods that match without boxing and without varargs, so exact matches and widening (for example <code>int</code> to <code>long</code>) are allowed. If phase 1 finds nothing, phase 2 also allows boxing and unboxing (<code>int</code> to <code>Integer</code>). Only if that also finds nothing does phase 3 allow varargs. Within a phase, the most specific method wins. &quot;Most specific&quot; means the method whose parameter types could all be passed on to the other candidate: <code>greet(String)</code> is more specific than <code>greet(Object)</code>, because every String is also an Object, but not the other way round. This is why, given <code>f(long)</code> and <code>f(Integer)</code>, the call <code>f(5)</code> picks <code>f(long)</code>: widening is found in phase 1, before boxing is even considered.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Overriding</strong> means a subclass provides a method with the same name and parameter list as the parent. The choice happens at runtime, based on the real object. The rules are: the return type may be a subtype of the parent&#x27;s return type (a covariant return); access cannot become more restrictive (a <code>public</code> method cannot become <code>protected</code>); and the override cannot declare new or broader checked exceptions (&quot;broader&quot; means a parent exception class: if the parent method throws <code>IOException</code>, the override cannot throw <code>Exception</code>, but it may throw <code>FileNotFoundException</code> or nothing). Always add <code>@Override</code>, so the compiler tells you if you accidentally overloaded instead of overriding.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "class Parent { void greet(Object o){ print(\"P-Obj\"); }  void greet(String s){ print(\"P-Str\"); } }\nclass Child extends Parent { void greet(Object o){ print(\"C-Obj\"); }  void greet(Integer n){ print(\"C-Int\"); } }\nParent p = new Child();\np.greet(\"hi\");          // P-Str : compiler picks greet(String); Child never overrode that one\np.greet((Object)\"hi\");  // C-Obj : compiler picks greet(Object); Child overrides it, so Child's runs\np.greet(5);             // C-Obj : see the first TRAP box just below\n// print(...) above is short for System.out.println(...)"
    },
    {
     "type": "trap",
     "html": "How <code>p.greet(5)</code> is decided. The compiler only searches <code>Parent</code>, so the candidates are <code>greet(Object)</code> and <code>greet(String)</code>; <code>greet(Integer)</code> lives only in <code>Child</code> and is invisible. Phase 1 (no boxing) finds nothing, because an <code>int</code> is neither an Object nor a String. Phase 2 allows boxing: <code>5</code> is boxed to an <code>Integer</code>, and an <code>Integer</code> can then be passed where an <code>Object</code> is expected, because Integer is a subclass of Object (moving from a subclass to a parent type is called reference widening, and phase 2 allows boxing followed by it). So the compiler picks <code>greet(Object)</code>. At runtime the object is a <code>Child</code>, which overrides <code>greet(Object)</code>, so C-Obj prints."
    },
    {
     "type": "trap",
     "html": "Always run the two steps in order. Step 1 (compile time): from the reference type and the argument types, the compiler picks one method signature. Step 2 (runtime): the JVM looks for an override of exactly that signature in the real object&#x27;s class. A method that exists only in the child, like <code>greet(Integer)</code> above, is never considered, because the compiler only searched <code>Parent</code>."
    },
    {
     "type": "sayit",
     "html": "Overloading is resolved at compile time from the declared argument types, in three phases: exact or widening, then boxing, then varargs. Overriding is resolved at runtime from the actual object&#x27;s class through dynamic dispatch. Static and private methods do not take part in dynamic dispatch, and final methods cannot be overridden, so the JVM can bind them directly."
    }
   ]
  },
  {
   "id": "1.3",
   "title": "Static methods hide; private and final methods are not overridden",
   "blocks": [
    {
     "type": "recall",
     "html": "If a subclass declares a static method with the same signature as a static method in the parent, the child&#x27;s method hides the parent&#x27;s. It does not override it. So with <code>Parent p = new Child();</code>, the call <code>p.show()</code> runs Parent&#x27;s static <code>show()</code>, because the compiler picks it from the reference type <code>Parent</code>. Putting <code>@Override</code> on the child&#x27;s static method is a compile error."
    },
    {
     "type": "p",
     "html": "<strong>Why static methods cannot be overridden.</strong> Overriding depends on looking at the real object at runtime. A static method belongs to the class, not to any object, so there is no object to look at. The compiler simply uses the type written before the dot (in the compiled class file the call becomes an <code>invokestatic</code> instruction, which simply means: call the static method of exactly this class; the instruction name is bonus vocabulary). Calling a static method through an instance reference compiles, but it is misleading; always call it as <code>Parent.show()</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Private methods.</strong> A private method in the parent is invisible to the child. If the child declares a method with the same name, that is a completely separate method. So if a public method <code>tell()</code> in <code>Parent</code> calls <code>show()</code>, and <code>show()</code> is private in <code>Parent</code>, it always calls Parent&#x27;s private <code>show()</code>, even when the object is a <code>Child</code> that has its own <code>show()</code>. See the code below.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Final methods.</strong> <code>final</code> on a method is the author saying &quot;subclasses must not change this behaviour&quot;. Because only one implementation can ever exist, the JIT (the compiler inside the JVM that turns frequently run code into machine code while the program runs) can call it directly, and can even inline it, which means copying the method&#x27;s body into the caller so no call happens at all.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Mixing static and instance.</strong> If the parent has an instance method and the child declares a static one with the same signature, or the other way round, the code does not compile. That is the reason for the error: one method cannot be both hidden (static) and overridden (instance) at the same time.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "class Parent { public void tell() { show(); }          // tell() calls Parent's private show()\n               private void show() { print(\"Parent show\"); } }\nclass Child extends Parent { public void show() { print(\"Child show\"); } }   // a new, unrelated method\nnew Child().tell();   // prints \"Parent show\": private methods are never overridden"
    },
    {
     "type": "trap",
     "html": "An interviewer writes <code>Parent p = new Child(); p.show();</code> where both classes have <code>static void show()</code>. The tempting answer is &quot;Child&#x27;s, because of polymorphism&quot;. The correct answer is Parent&#x27;s, because static methods are bound at compile time from the reference type."
    },
    {
     "type": "sayit",
     "html": "Static methods are hidden, not overridden: they belong to the class, so the call is bound at compile time from the reference type. Private methods aren&#x27;t visible to subclasses, so a same-named child method is unrelated. Final methods can&#x27;t be overridden, which also lets the JIT inline them."
    }
   ]
  },
  {
   "id": "1.4",
   "title": "Abstract class vs interface, and the default-method diamond",
   "blocks": [
    {
     "type": "recall",
     "html": "An interface describes a capability (what something can do) and holds no per-object state and no constructor. An abstract class is a partly built parent: it can hold instance fields, run constructor logic, and offer <code>protected</code> members meant for subclasses (they are also visible to classes in the same package)."
    },
    {
     "type": "p",
     "html": "<strong>What an interface may contain.</strong> Methods are <code>public abstract</code> unless you say otherwise. Since Java 8 an interface can have <code>default</code> methods (with a body) and <code>static</code> methods. Since Java 9 it can have <code>private</code> methods, which exist so that several default methods can share helper code without exposing it. Every field in an interface is automatically <code>public static final</code>, which means it is a constant shared by everyone, not per-object state.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why an interface has no constructor.</strong> A constructor&#x27;s job is to set up an object&#x27;s fields. An interface has no instance fields to set up, and you can never call <code>new</code> on an interface. When you want creation logic on an interface, use a static factory method, as <code>List.of(...)</code> does.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>How to choose.</strong> Pick an abstract class when the subclasses need shared instance fields, constructor logic that every subclass must run, or <code>protected</code> methods meant only for subclasses. In every other case, pick an interface: a class can implement many interfaces but extend only one class, so interfaces keep your options open.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The diamond problem with default methods.</strong> If a class inherits two methods with the same signature, Java applies three rules in order. Rule 1: a method declared in a class (or inherited from a superclass) always beats any interface default. Rule 2: if one interface extends the other, the more specific (child) interface&#x27;s default wins. Rule 3: if two unrelated interfaces both declare the method and at least one of them provides a default, the code does not compile until your class overrides the method itself. Inside that override you can delegate to one of them with <code>Walker.super.go()</code>.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "interface Walker  { default String go() { return \"walk\"; } }\ninterface Swimmer { default String go() { return \"swim\"; } }\nclass Duck implements Walker, Swimmer {\n    public String go() { return Walker.super.go() + \"+\" + Swimmer.super.go(); }  // required, or compile error\n}"
    },
    {
     "type": "trap",
     "html": "An interface field such as <code>List&lt;String&gt; ITEMS = new ArrayList&lt;&gt;();</code> is <code>final</code>, so nobody can point <code>ITEMS</code> at a different list. But the list itself is still mutable, and every implementing class shares the same one, so any class can add to it or clear it."
    },
    {
     "type": "trap",
     "html": "Default methods did not give Java multiple inheritance of state. A class can inherit behaviour from several interfaces, but it still has fields from only one class chain."
    },
    {
     "type": "sayit",
     "html": "An interface is a contract for a capability: no instance state, no constructor, and since Java 8 it can carry default and static methods, and since Java 9 private helpers. I choose an abstract class when subclasses need shared fields, constructor logic, or protected members. For conflicting defaults, a class method wins, then the more specific interface, and two unrelated defaults force me to override and pick one with X.super.method()."
    }
   ]
  },
  {
   "id": "1.5",
   "title": "Constructors and initialization order",
   "blocks": [
    {
     "type": "recall",
     "html": "Static parts run once per class, the first time the class is used, and the parent&#x27;s static parts run before the child&#x27;s. Then, for every <code>new Child()</code>, Java builds the object from the top of the hierarchy down: the parent&#x27;s instance fields and instance blocks, then the parent&#x27;s constructor body, then the child&#x27;s instance fields and instance blocks, then the child&#x27;s constructor body."
    },
    {
     "type": "p",
     "html": "<strong>The first line of every constructor.</strong> It is always either <code>this(...)</code> (call another constructor of the same class) or <code>super(...)</code> (call a parent constructor). If you write neither, the compiler inserts <code>super()</code> for you. That is how the parent always gets built first. It is also why a class whose parent has no no-argument constructor fails to compile unless it calls <code>super(args)</code> explicitly.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What &quot;static parts&quot; means.</strong> Static field initializers and <code>static { }</code> blocks run in the order they appear in the source file, during class initialization. Class initialization happens once, on first active use (for example the first <code>new</code>, or the first call to a static method).",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What &quot;instance parts&quot; means.</strong> Instance field initializers and <code>{ }</code> instance blocks also run in source order. They run after the <code>super(...)</code> call returns and before the rest of the constructor body. If a constructor starts with <code>this(...)</code> instead, it does not run the instance parts itself; the constructor it delegates to (which eventually calls <code>super</code>) runs them. So instance blocks run exactly once per object, never twice.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why a constructor cannot be <code>final</code>, <code>static</code> or <code>abstract</code>.</strong> It is never inherited, so <code>final</code> would mean nothing. It exists to create an instance, so <code>static</code> contradicts it. It must contain the code that sets the object up, so <code>abstract</code> (no body) makes no sense.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "class A { static { print(\"static A\"); }  { print(\"instance A\"); }  A() { print(\"ctor A\"); } }\nclass B extends A { static { print(\"static B\"); }  { print(\"instance B\"); }  B() { print(\"ctor B\"); } }\nnew B();  // static A, static B, instance A, ctor A, instance B, ctor B\nnew B();  // instance A, ctor A, instance B, ctor B      (static parts never run again)"
    },
    {
     "type": "trap",
     "html": "Never call an overridable method from a constructor. <code>new Child()</code> first creates the whole Child object in memory, with every field at its default value (0, false or null), and only then runs the constructors, parent first. So while the parent&#x27;s constructor runs, the object is already a <code>Child</code>, so dynamic dispatch sends the call to the child&#x27;s override. But the child&#x27;s fields have not been initialized yet, so the override sees <code>0</code>, <code>false</code> or <code>null</code>. This is true even for the child&#x27;s <code>final</code> fields, unless they are compile-time constants. A compile-time constant is a <code>final</code> variable or field, of a primitive type or String, set directly to a literal or constant expression (for example <code>final int MAX = 10;</code>). The compiler copies its value straight into the code that uses it, so it is never seen as 0. The same rule drives constant folding in card 1.6. Make such methods <code>private</code> or <code>final</code> (Effective Java, Item 19)."
    },
    {
     "type": "sayit",
     "html": "Static initializers run once per class, parent first, on first use. For each new object, construction goes top-down: the parent&#x27;s field initializers and instance blocks, then the parent&#x27;s constructor body, then the same for the child. Every constructor starts with this() or super(), and the compiler adds super() if I don&#x27;t write it. Calling an overridable method from a constructor is a bug because it reaches the child before the child&#x27;s fields are set."
    }
   ]
  },
  {
   "id": "1.6",
   "title": "String: immutability, the String pool and constant folding",
   "blocks": [
    {
     "type": "recall",
     "html": "A String can never change after it is created, and the <code>String</code> class is <code>final</code>, so nobody can subclass it and add mutable behaviour. That makes Strings safe to share between threads and between parts of a program. Their hash code can be computed once and cached, they can be pooled, they are safe HashMap keys, and a String that passed a security check (a file path, a URL) cannot be altered afterwards."
    },
    {
     "type": "p",
     "html": "<strong>The String pool.</strong> Every string literal in your code, such as <code>&quot;hi&quot;</code>, is interned: the JVM keeps one shared copy in the String pool, and every literal <code>&quot;hi&quot;</code> in the program refers to that same object. Since Java 7 the pool lives on the main heap instead of the old PermGen area (PermGen was a separate, small, fixed-size memory area for class data, removed entirely in Java 8), so it is no longer squeezed into PermGen&#x27;s small fixed size, and unreferenced pooled strings are garbage-collected like any other object.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>new String(&quot;hi&quot;)</code> always creates a new object</strong> on the heap, separate from the pooled <code>&quot;hi&quot;</code>. That is why <code>&quot;hi&quot; == new String(&quot;hi&quot;)</code> is false.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>==</code> versus <code>equals</code>.</strong> <code>==</code> checks whether two references point to the same object. <code>equals</code> checks whether the characters are the same. For Strings and for boxed types like <code>Integer</code>, always use <code>equals</code>. <code>==</code> will sometimes appear to work only because of pooling or caching, and then fail on other values.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Constant folding.</strong> When every part of a <code>+</code> expression is a compile-time constant, the compiler joins the parts while compiling. So <code>&quot;a&quot; + &quot;b&quot;</code> becomes the literal <code>&quot;ab&quot;</code> and refers to the pooled object. A <code>final</code> local variable or field set directly to a literal also counts as a constant (the compile-time constant rule from card 1.5). But if any part is an ordinary variable, the joining happens at runtime and produces a brand-new String object, even if the text is identical.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Methods that look like they change a String return a new one.</strong> <code>concat</code>, <code>toUpperCase</code>, <code>trim</code>, <code>replace</code> and the rest all return a new String. If you write <code>s.concat(&quot; world&quot;);</code> and ignore the result, <code>s</code> is unchanged. You must write <code>s = s.concat(&quot; world&quot;);</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>intern()</code></strong> returns the pool&#x27;s copy of a string with the same characters, adding this string to the pool if no copy exists yet. It is only worth using when the same small set of values repeats many times. Never intern unbounded input such as user IDs; the pool keeps growing and becomes a memory problem.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>StringBuilder vs StringBuffer.</strong> To build a string step by step, for example in a loop, use <code>StringBuilder</code>, which is mutable and fast. <code>StringBuffer</code> does the same job but synchronizes every method; it is a legacy class and is slower.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "String a = \"hi\", b = new String(\"hi\"), c = b.intern();\na == b          // false : b is a separate heap object\na == c          // true  : intern() returned the pooled \"hi\"\na.equals(b)     // true  : same characters\nString s1 = \"ab\";\nfinal String x = \"a\";    // compile-time constant\nString y = \"a\";          // ordinary variable\ns1 == (\"a\" + \"b\")  // true  : folded at compile time to the literal \"ab\"\ns1 == (x + \"b\")    // true  : x is a constant, so this also folds\ns1 == (y + \"b\")    // false : y is a variable, so the String is built at runtime\n// (the brackets are only for reading: + always happens before ==)"
    },
    {
     "type": "trap",
     "html": "<code>final String x = getPrefix();</code> is not a compile-time constant, because its value comes from a method call. So <code>x + &quot;b&quot;</code> is built at runtime and <code>==</code> against the literal is false. Only a <code>final</code> variable initialized directly with a constant expression folds."
    },
    {
     "type": "sayit",
     "html": "Strings are immutable and the class is final, which makes them thread-safe, hash-cacheable, poolable and safe as map keys. Literals are interned in the String pool on the heap. Concatenating only compile-time constants is folded by the compiler into one pooled literal, while anything involving a regular variable creates a new String at runtime. That&#x27;s why I always compare Strings with equals, never ==."
    }
   ]
  },
  {
   "id": "1.7",
   "title": "The equals / hashCode contract",
   "blocks": [
    {
     "type": "recall",
     "html": "If two objects are equal according to <code>equals</code>, they must return the same <code>hashCode</code>. The reverse is not required: two different objects may share a hash code (that is a collision). <code>equals</code> itself must be reflexive, symmetric, transitive and consistent, and <code>x.equals(null)</code> must return false."
    },
    {
     "type": "p",
     "html": "<strong>Why the rule exists: how HashMap uses the two methods.</strong> HashMap first uses <code>hashCode</code> to choose a bucket. Only inside that bucket does it call <code>equals</code> to find the matching key. So both methods must agree.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>What breaks if you override only one.</strong> If you override <code>equals</code> but not <code>hashCode</code>, two equal keys get different identity-based hash codes. HashMap compares the stored hash before it ever calls <code>equals</code>, so <code>get</code> returns null, even in the rare case where both keys land in the same bucket. If you override <code>hashCode</code> but not <code>equals</code>, the lookup reaches the right bucket, but the default <code>equals</code> compares references, so a new but equal key is still not found.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The five rules of <code>equals</code>, in plain words.</strong> Reflexive: <code>x.equals(x)</code> is true. Symmetric: if <code>x.equals(y)</code> then <code>y.equals(x)</code>. Transitive: if <code>x</code> equals <code>y</code> and <code>y</code> equals <code>z</code>, then <code>x</code> equals <code>z</code>. Consistent: the answer does not change unless one of the objects changes. Non-null: <code>x.equals(null)</code> is false and never throws.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A safe template.</strong> Start with <code>if (this == o) return true;</code>, then <code>if (!(o instanceof Emp e)) return false;</code> then compare the fields. In <code>hashCode</code>, use exactly the same fields. If <code>equals</code> uses a field that <code>hashCode</code> ignores, or the other way round, the contract breaks. The full code is below. <code>o instanceof Emp e</code> is pattern matching (Java 16+): it checks the type and, if it matches, gives you <code>e</code>, which is <code>o</code> already cast to <code>Emp</code>. On Java 8 or 11 write <code>if (!(o instanceof Emp)) return false; Emp e = (Emp) o;</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The default <code>hashCode</code></strong> (from <code>Object</code>) is an identity hash. The JVM generates a number the first time it is asked for, and stores it in the object&#x27;s header so the same object always returns the same number. It is not literally the memory address, because objects move during garbage collection.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The Integer cache.</strong> <code>Integer.valueOf</code> (which autoboxing uses) returns cached objects for values from −128 to 127. So with <code>Integer a = 127, b = 127;</code> the check <code>a == b</code> is true (same cached object), but with <code>Integer a = 128, b = 128;</code> the check <code>a == b</code> is false (two different objects) with default JVM settings. Only −128 to 127 is guaranteed; the upper bound can be raised with <code>-XX:AutoBoxCacheMax</code>. This is exactly why you must compare boxed numbers with <code>equals</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>instanceof</code> or <code>getClass()</code> inside equals?</strong> <code>instanceof</code> accepts subclasses, which respects the Liskov principle (a subclass can stand in for its parent). <code>getClass() != o.getClass()</code> accepts only the exact same class, which is stricter. A real-world case where getClass() hurts: Hibernate wraps entities in generated proxy subclasses, so with getClass() a loaded <code>Emp</code> and a proxy for the same row are never equal, even with the same id. The trap below shows the other side of the trade-off.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "class Emp {                       // an example Employee class\n    private final long id; private final String name;\n    @Override public boolean equals(Object o) {\n        if (this == o) return true;\n        if (!(o instanceof Emp e)) return false;      // e is o, already cast to Emp\n        return id == e.id && Objects.equals(name, e.name);\n    }\n    @Override public int hashCode() { return Objects.hash(id, name); }  // same fields as equals\n}"
    },
    {
     "type": "trap",
     "html": "<strong>The Point / ColorPoint problem.</strong> <code>ColorPoint extends Point</code> and adds a <code>color</code> field to its <code>equals</code>. Take a Point(1,2) and a red ColorPoint(1,2), with the same coordinates. Then <code>point.equals(colorPoint)</code> is true (Point&#x27;s equals ignores colour), but <code>colorPoint.equals(point)</code> is false (a Point is not a ColorPoint), so symmetry is broken. Switching to <code>getClass()</code> restores symmetry, but now a ColorPoint can never equal a Point, even in code written for Points. For example, a <code>Set&lt;Point&gt;</code> holding Point(1,2) says <code>contains(new ColorPoint(1,2,RED))</code> is false, and a method that counts how many points sit at the origin ignores every ColorPoint there. The Liskov principle says a subclass object must work anywhere its parent is expected, and here it does not. Joshua Bloch&#x27;s conclusion: you cannot extend an instantiable class (an ordinary class you can create with <code>new</code>, not abstract), add a value field, and keep the equals contract. Use composition (ColorPoint holds a Point), or make the class <code>final</code>, or use a record."
    },
    {
     "type": "sayit",
     "html": "Equal objects must have equal hash codes, because HashMap finds the bucket by hashCode and only then compares with equals. If the two disagree, entries become unreachable. I build both from the same fields, use instanceof or getClass deliberately, and avoid adding value fields in subclasses because that breaks symmetry or Liskov."
    }
   ]
  },
  {
   "id": "1.8",
   "title": "Designing an immutable class; a final reference is not an immutable object",
   "blocks": [
    {
     "type": "recall",
     "html": "The recipe for an immutable class: make the class <code>final</code>; make every field <code>private final</code>; provide no setters; set every field in the constructor; and make defensive copies of mutable objects both when they come in and when they go out."
    },
    {
     "type": "p",
     "html": "<strong>Why each step matters.</strong> <code>final</code> on the class stops a subclass from adding mutable state or overriding methods. <code>private final</code> fields cannot be reassigned after construction. Without setters, nothing outside can change the state. Defensive copies stop the caller from changing the object through a reference it still holds.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>final</code> on a field only freezes the reference.</strong> With <code>private final List&lt;String&gt; items;</code> nobody can make <code>items</code> point to a different list. But the list object itself can still be changed by anyone who has a reference to it, including the caller who passed it into your constructor.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>The fix: copy into an unmodifiable list.</strong> Write <code>this.items = List.copyOf(input);</code> (Java 10+). That makes a copy the caller cannot reach, and the copy itself rejects any change. Note that <code>List.copyOf</code> throws a NullPointerException if the input contains null.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why <code>Collections.unmodifiableList(input)</code> is not enough.</strong> It returns a read-only view of the caller&#x27;s original list. Your class cannot change it through the view, but the caller still holds the original and can change it, and your view shows the change. If you use it, copy first: <code>Collections.unmodifiableList(new ArrayList&lt;&gt;(input))</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Returning the field.</strong> If the field already holds an unmodifiable copy, you can return it directly. If it holds an ordinary mutable object (a <code>Date</code>, an array), return a copy, otherwise the caller can change your internal state. Better still, store immutable types such as <code>LocalDate</code> instead of <code>Date</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>A bonus for concurrency.</strong> When all fields are <code>final</code>, the Java Memory Model guarantees that any thread that sees the object also sees those fields fully set, as long as <code>this</code> did not escape during construction. &quot;Escape&quot; means the constructor handed <code>this</code> to other code before it finished, for example <code>eventBus.register(this);</code> or starting a thread inside the constructor; that other code could then see half-set fields. So never leak <code>this</code> from a constructor. With that rule kept, immutable objects can be shared between threads without locks. (The memory-model details come on Day 4; here, just remember: final fields plus no escaping <code>this</code> means safe sharing.)",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Records.</strong> A <code>record</code> is a final class whose fields are <code>private final</code>, with <code>equals</code>, <code>hashCode</code> and <code>toString</code> generated from them. That makes it ideal for value types. A record is only shallowly immutable, though: the fields cannot be reassigned, but a <code>List</code> stored in one can still be modified, unless you copy it. You copy it in the compact constructor, which is a record constructor written without the parameter list; Java assigns the fields automatically after it runs.",
     "bullet": true
    },
    {
     "type": "code",
     "code": "record Order(String id, List<String> items) {\n    Order {                              // compact constructor: no parameter list\n        items = List.copyOf(items);      // replace the caller's list with an unmodifiable copy\n    }\n}"
    },
    {
     "type": "trap",
     "html": "A mutable object used as a HashMap key and changed after <code>put</code> gets stuck. Its entry stays in the bucket chosen from the old hash code, so <code>size()</code> still counts it and iteration still shows it, but <code>get</code> looks in the new bucket and never finds it. Keys should be immutable: String, Integer, Long, UUID, LocalDate, enums, or records of immutable values."
    },
    {
     "type": "sayit",
     "html": "I make the class final with private final fields, no setters, everything set in the constructor, and I defensively copy mutable inputs and outputs, usually with List.copyOf. final on a field only fixes the reference; the object it points to can still change. Immutable objects are thread-safe by design and make safe HashMap keys."
    }
   ]
  },
  {
   "id": "1.9",
   "title": "final vs finally vs finalize",
   "blocks": [
    {
     "type": "recall",
     "html": "<code>final</code> is a keyword that means &quot;cannot be changed&quot;: a final variable cannot be reassigned, a final method cannot be overridden, and a final class cannot be extended. <code>finally</code> is the block after <code>try</code> that runs however the try ends, whether normally, by <code>return</code>, or by an exception. <code>finalize()</code> was a method the garbage collector could call before reclaiming an object; it is deprecated and should never be used."
    },
    {
     "type": "p",
     "html": "<strong>When <code>finally</code> does not run.</strong> <code>System.exit()</code> stops the JVM, so <code>finally</code> never runs. A JVM crash or a <code>kill -9</code> stops it too, and so does a try block that never finishes, such as an infinite loop.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong><code>return</code> inside <code>finally</code> is a bug.</strong> It replaces whatever value the try block was returning, and if the try block threw an exception, the exception silently disappears. Never return from <code>finally</code>.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Changing the return value inside <code>finally</code>.</strong> If the try block executes <code>return x;</code> and <code>finally</code> then sets <code>x = 99</code>, the caller still receives the old value, because it was saved before <code>finally</code> ran. But if <code>x</code> is an object and <code>finally</code> mutates it (for example by adding to a list), the caller sees the mutation, because it is the same object.",
     "bullet": true
    },
    {
     "type": "p",
     "html": "<strong>Why <code>finalize()</code> is gone.</strong> There is no guarantee when it runs, or that it runs at all. It slows down garbage collection, and it can resurrect objects (<code>finalize</code> could store <code>this</code> in a static field, making a dead object reachable again). It was deprecated in Java 9 and marked for removal in Java 18. Use try-with-resources to release resources. As a last-resort safety net there is <code>java.lang.ref.Cleaner</code>, a class that runs a cleanup action after an object becomes unreachable; you only need the name.",
     "bullet": true
    },
    {
     "type": "sayit",
     "html": "final restricts change: the variable can&#x27;t be reassigned, the method can&#x27;t be overridden, the class can&#x27;t be extended. finally always runs after try or catch, except on System.exit, a JVM crash or kill -9, or a try that never finishes, and a return inside it swallows exceptions. finalize is deprecated for removal; I use try-with-resources or Cleaner instead."
    }
   ]
  }
 ],
 "quiz": [
  {
   "q": "<code>Parent p = new Child();</code> and both classes define <code>static void show()</code>. What does <code>p.show()</code> print, and why?",
   "a": "Parent&#x27;s version. Static methods are hidden, not overridden, and the call is bound at compile time from the reference type <code>Parent</code>."
  },
  {
   "q": "Given <code>void f(long x)</code> and <code>void f(Integer x)</code>, which one does <code>f(5)</code> call?",
   "a": "<code>f(long)</code>. Overload resolution tries phase 1 first (widening, no boxing), and <code>int</code> to <code>long</code> widening matches there, so boxing to Integer is never considered."
  },
  {
   "q": "A class overrides <code>equals</code> but not <code>hashCode</code> and is used as a HashMap key. What do you observe?",
   "a": "<code>get</code> with a new but equal key returns null: the new key has a different identity hash code, and HashMap compares hash values before calling equals."
  },
  {
   "q": "<code>String a = &quot;a&quot;; String s = a + &quot;b&quot;;</code> Is <code>s == &quot;ab&quot;</code>? What if <code>a</code> is declared <code>final</code>?",
   "a": "False, because <code>a</code> is a variable and the String is built at runtime as a new object. With <code>final String a = &quot;a&quot;;</code> it is a compile-time constant, the expression folds to the pooled <code>&quot;ab&quot;</code>, and the result is true."
  },
  {
   "q": "<code>Integer a = 128, b = 128;</code> What is <code>a == b</code>? And for 127?",
   "a": "False for 128 (with default settings), because they are two different objects. True for 127, because <code>Integer.valueOf</code> returns the same cached object for values from −128 to 127. Always compare boxed numbers with equals."
  },
  {
   "q": "Is a class with <code>private final List&lt;String&gt; items</code> immutable?",
   "a": "Not by itself. <code>final</code> only fixes the reference. Copy the input in the constructor with <code>List.copyOf(input)</code>, which is an unmodifiable copy (not <code>Collections.unmodifiableList(input)</code>, which is only a view of the caller&#x27;s list), and the class becomes immutable (if the rest of the recipe holds)."
  },
  {
   "q": "Why is calling an overridable method from a constructor a bug?",
   "a": "Dynamic dispatch: the object is already a Child, so the parent&#x27;s constructor sends the call to the child&#x27;s override before the child&#x27;s fields are initialized, so the override sees 0 or null."
  },
  {
   "q": "Two interfaces both give a default <code>go()</code>, and a class implements both. What happens?",
   "a": "It does not compile until the class overrides <code>go()</code>. Inside the override it can call <code>A.super.go()</code> or <code>B.super.go()</code>."
  },
  {
   "q": "The try block returns 1, and <code>finally</code> contains <code>return 2</code>. What does the method return, and what if the try had thrown?",
   "a": "It returns 2 in both cases. If the try block threw, the exception is silently lost. That is why you never return from finally."
  }
 ]
});
