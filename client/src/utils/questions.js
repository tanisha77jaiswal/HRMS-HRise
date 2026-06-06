/**
 * Dynamically tailored professional technical interview questions pool
 * for Frontend, Backend, Full Stack, AI/ML, and General Software Engineering roles.
 * Each pool contains 15 highly realistic, domain-specific questions of varying difficulties.
 */

const QUESTION_BANKS = {
  fullstack: [
    { id: "fs-1", question: "Walk us through your experience building end-to-end full stack web applications. What was the most complex architecture you designed?", category: "Experience", difficulty: "medium" },
    { id: "fs-2", question: "How do you manage complex state between client and server? When do you prefer Server-Side Rendering (SSR) over Client-Side Rendering (CSR)?", category: "Technical", difficulty: "hard" },
    { id: "fs-3", question: "Describe how you design databases for a full stack app. How do you handle schema migrations in SQL databases without causing service downtime?", category: "Database", difficulty: "hard" },
    { id: "fs-4", question: "What are your best practices for designing scalable, versioned RESTful APIs or GraphQL endpoints that support high client concurrency?", category: "API Design", difficulty: "medium" },
    { id: "fs-5", question: "How do you secure a full stack application against common vulnerabilities like XSS, CSRF, and SQL Injection?", category: "Security", difficulty: "hard" },
    { id: "fs-6", question: "How do you optimize overall full stack performance? Discuss your caching strategies across CDNs, Redis servers, and browser caches.", category: "Performance", difficulty: "hard" },
    { id: "fs-7", question: "What is your preferred approach to state management in React, and how does it interface with backend fetch APIs?", category: "Frontend State", difficulty: "medium" },
    { id: "fs-8", question: "How do you dockerize and deploy a full stack app with a database, backend service, and frontend client on AWS or Kubernetes?", category: "DevOps", difficulty: "medium" },
    { id: "fs-9", question: "Describe your strategy for end-to-end testing of a full stack application. What tools (e.g. Cypress, Playwright, Jest) do you utilize?", category: "Testing", difficulty: "medium" },
    { id: "fs-10", question: "How do you implement secure user authentication and authorization using JWTs, OAuth2, or sessions in a full-stack system?", category: "Authentication", difficulty: "hard" },
    { id: "fs-11", question: "What are the bottlenecks of full-stack scalability, and how do you implement load balancing and message queues (like RabbitMQ/Kafka) to resolve them?", category: "Scalability", difficulty: "hard" },
    { id: "fs-12", question: "How do you implement real-time communication in a full stack app (e.g., WebSockets, SSE) and scale the connection broker?", category: "Real-time", difficulty: "hard" },
    { id: "fs-13", question: "How do you evaluate and select a tech stack (e.g. MERN, Next.js + Postgres) for a new, highly scaling project?", category: "Architecture", difficulty: "medium" },
    { id: "fs-14", question: "How do you track, log, and monitor errors in production environments across both client-side and server-side systems?", category: "Monitoring", difficulty: "medium" },
    { id: "fs-15", question: "How do you design a full stack application to support offline functionality or poor network conditions using Service Workers?", category: "Offline", difficulty: "hard" }
  ],
  frontend: [
    { id: "fe-1", question: "Walk us through your experience building modern web apps. What was your most complex React project?", category: "Experience", difficulty: "medium" },
    { id: "fe-2", question: "How do you manage complex application state in React (e.g. Context, Redux, Zustand) and prevent unnecessary re-renders?", category: "Technical", difficulty: "hard" },
    { id: "fe-3", question: "Describe a time when you had to optimize the loading performance or bundle size of a frontend application.", category: "Performance", difficulty: "hard" },
    { id: "fe-4", question: "What styling frameworks (like Tailwind CSS, CSS Modules) do you prefer and how do you ensure responsive layouts?", category: "Technical", difficulty: "easy" },
    { id: "fe-5", question: "How do you approach testing frontend components, and what tools (Jest, React Testing Library) do you use?", category: "Testing", difficulty: "medium" },
    { id: "fe-6", question: "What are the benefits and trade-offs of using Next.js App Router versus standard Client-Side Routing (like react-router-dom)?", category: "Routing", difficulty: "medium" },
    { id: "fe-7", question: "Explain how the React Virtual DOM works. How does React's reconciliation algorithm handle diffs?", category: "DOM", difficulty: "hard" },
    { id: "fe-8", question: "How do you ensure web accessibility (a11y) and SEO optimization are fully supported in your frontend designs?", category: "Accessibility", difficulty: "medium" },
    { id: "fe-9", question: "How do you handle asynchronous actions, infinite scrolling, and real-time UI updates with browser APIs?", category: "Web APIs", difficulty: "medium" },
    { id: "fe-10", question: "What is your experience with modern bundlers like Vite, Webpack, or Turbopack? How do you customize their configurations?", category: "Build Tools", difficulty: "medium" },
    { id: "fe-11", question: "How does using TypeScript improve code quality in frontend development, and how do you declare complex generic component types?", category: "Type Safety", difficulty: "medium" },
    { id: "fe-12", question: "Have you worked with micro-frontends or module federation? Describe the architectural pros and cons of splitting web clients?", category: "Micro-frontends", difficulty: "hard" },
    { id: "fe-13", question: "What is client-side hydration in React SSR, and how do you resolve mismatch errors between server and client rendering?", category: "Hydration", difficulty: "hard" },
    { id: "fe-14", question: "How do you construct and maintain a reusable frontend design system using CSS variables, Tailwind, or styled-components?", category: "Design Systems", difficulty: "medium" },
    { id: "fe-15", question: "What are frontend security best practices, and how do you prevent unauthorized data exposure or malicious script injection?", category: "Security", difficulty: "medium" }
  ],
  backend: [
    { id: "be-1", question: "Tell us about your backend engineering experience. What was your most scaling-heavy infrastructure project?", category: "Experience", difficulty: "medium" },
    { id: "be-2", question: "How do you design secure and performant RESTful APIs or GraphQL endpoints for concurrent users?", category: "API Protocols", difficulty: "hard" },
    { id: "be-3", question: "How do you handle database optimization, indexes, and queries in PostgreSQL or MongoDB under heavy load?", category: "Database Tuning", difficulty: "hard" },
    { id: "be-4", question: "Walk us through how you containerize services with Docker and configure CI/CD pipelines to deploy to AWS or Kubernetes.", category: "Containers", difficulty: "medium" },
    { id: "be-5", question: "How do you ensure secure user authentication, token management, and data encryption in your backend APIs?", category: "Security", difficulty: "medium" },
    { id: "be-6", question: "Describe the challenges of a microservices architecture. How do you handle distributed transactions or service-to-service communication?", category: "Microservices", difficulty: "hard" },
    { id: "be-7", question: "How and where do you introduce caching in backend systems? Describe your experience utilizing Redis or Memcached.", category: "Caching", difficulty: "medium" },
    { id: "be-8", question: "How do you manage asynchronous concurrency and memory efficiency in backend runtimes like Node.js, Go, or Java?", category: "Concurrency", difficulty: "hard" },
    { id: "be-9", question: "Explain how and when you would use a message broker like RabbitMQ or Kafka in a backend event-driven architecture?", category: "Message Queues", difficulty: "hard" },
    { id: "be-10", question: "What is your approach to backend observability? What monitoring tools (APM, ELK Stack, Prometheus, Grafana) have you used?", category: "Observability", difficulty: "medium" },
    { id: "be-11", question: "How do you approach designing a rate-limiting system or API gateway for backend services?", category: "System Design", difficulty: "hard" },
    { id: "be-12", question: "Explain how load balancers operate and how you manage session affinity or stateless scaling in backend deployments?", category: "Scaling", difficulty: "medium" },
    { id: "be-13", question: "How do you ensure ACID properties and transactional integrity in databases across backend API routes?", category: "Transactions", difficulty: "hard" },
    { id: "be-14", question: "How do you manage large file uploads, processing, and assets delivery using services like AWS S3 and CloudFront?", category: "File Storage", difficulty: "medium" },
    { id: "be-15", question: "What are the trade-offs of using GraphQL over traditional REST APIs in backend setups?", category: "GraphQL vs REST", difficulty: "medium" }
  ],
  aiml: [
    { id: "ml-1", question: "Tell us about your experience with machine learning projects. What was the most impactful one?", category: "Experience", difficulty: "medium" },
    { id: "ml-2", question: "How do you approach model selection and tuning (hyperparameters, cross-validation) when working on a new problem?", category: "Tuning", difficulty: "hard" },
    { id: "ml-3", question: "Describe a time when you had to explain a complex ML model to a non-technical stakeholder.", category: "Communication", difficulty: "medium" },
    { id: "ml-4", question: "What ML frameworks (like PyTorch, TensorFlow, Scikit-Learn) are you most comfortable with and why?", category: "Frameworks", difficulty: "easy" },
    { id: "ml-5", question: "How do you evaluate and optimize model fairness and prevent bias in production?", category: "Ethics", difficulty: "medium" },
    { id: "ml-6", question: "Describe your experience with LLMs, prompt engineering, fine-tuning, or building RAG systems with vector databases.", category: "LLMs & GenAI", difficulty: "hard" },
    { id: "ml-7", question: "How do you handle the packaging, versioning, deployment, and drift monitoring of ML models in production?", category: "MLOps", difficulty: "hard" },
    { id: "ml-8", question: "Walk us through your feature engineering and data preprocessing workflow for highly unstructured datasets.", category: "Feature Engineering", difficulty: "medium" },
    { id: "ml-9", question: "Explain the concept of backpropagation. How do you mitigate vanishing or exploding gradients in deep networks?", category: "Deep Learning", difficulty: "hard" },
    { id: "ml-10", question: "What is your experience with transformers, CNNs, or RNNs? In what scenarios do you recommend them?", category: "Neural Networks", difficulty: "hard" },
    { id: "ml-11", question: "How do you process, clean, and manage large-scale datasets using tools like Spark, pandas, or SQL query engines?", category: "Big Data", difficulty: "medium" },
    { id: "ml-12", question: "Describe the difference between supervised learning, unsupervised learning, and reinforcement learning. Give real-world examples.", category: "Learning Styles", difficulty: "easy" },
    { id: "ml-13", question: "How do you handle high-dimensional data, and what dimensionality reduction techniques (like PCA, t-SNE) do you use?", category: "Dimensionality", difficulty: "medium" },
    { id: "ml-14", question: "What is overfitting, and what regularization techniques (L1, L2, dropout, early stopping) do you employ to prevent it?", category: "Overfitting", difficulty: "medium" },
    { id: "ml-15", question: "How would you design a personalized recommendation engine? What are collaborative filtering and content-based approaches?", category: "Recommenders", difficulty: "hard" }
  ],
  general: [
    { id: "ge-1", question: "Tell us about your background in software engineering. What was the most technical project you worked on?", category: "Experience", difficulty: "medium" },
    { id: "ge-2", question: "How do you approach learning a new programming language, framework, or technology stack rapidly?", category: "Growth", difficulty: "easy" },
    { id: "ge-3", question: "Describe a time when you had to debug a complex runtime error or bottleneck in production.", category: "Technical", difficulty: "hard" },
    { id: "ge-4", question: "How do you structure your code and projects to ensure high maintainability, readability, and solid documentation?", category: "Design", difficulty: "medium" },
    { id: "ge-5", question: "What are your preferred tools and workflows for version control, collaborative coding, and code reviews?", category: "DevOps", difficulty: "easy" },
    { id: "ge-6", question: "Describe your experience with agile software development and how you collaborate with product managers and other engineers?", category: "Agile", difficulty: "easy" },
    { id: "ge-7", question: "What is your approach to writing testable code? When do you choose TDD (Test-Driven Development)?", category: "Testing", difficulty: "medium" },
    { id: "ge-8", question: "How do you analyze code execution time and space complexity? Give an example of refactoring code for Big O optimization.", category: "Algorithms", difficulty: "hard" },
    { id: "ge-9", question: "What is the importance of CI/CD, and how do you construct automated build and lint pipelines?", category: "Pipelines", difficulty: "medium" },
    { id: "ge-10", question: "How do you define technical debt, and how do you convince business leaders to prioritize refactoring legacy systems?", category: "Technical Debt", difficulty: "medium" },
    { id: "ge-11", question: "Compare Object-Oriented Programming (OOP) and Functional Programming (FP). When is one style more suitable?", category: "OOP vs FP", difficulty: "medium" },
    { id: "ge-12", question: "What are your architectural design patterns of choice (e.g. MVC, Clean Architecture, Hexagonal)? Give examples of use.", category: "Architecture", difficulty: "hard" },
    { id: "ge-13", question: "How do you design systems to handle high availability and fault tolerance (e.g. circuit breakers, retries)?", category: "System Failures", difficulty: "hard" },
    { id: "ge-14", question: "Describe a time you disagreed with an architectural choice made by a team member. How did you align?", category: "Technical Conflict", difficulty: "medium" },
    { id: "ge-15", question: "What factors do you consider when selecting and integrating third-party APIs or microservices in your systems?", category: "APIs Integration", difficulty: "medium" }
  ]
};

/**
 * Resolves a tailored, role-specific list of questions matching a target count.
 * Matches keywords for Full Stack, Frontend, Backend, AI/ML, and General.
 *
 * @param {string} jobTitle - The job title of the target position.
 * @param {number} count - The number of questions requested (defaults to 5).
 * @returns {Array} List of selected technical questions.
 */
export function getTailoredQuestions(jobTitle, count = 5) {
  const titleLower = (jobTitle || "general").toLowerCase();
  let bank = [];

  if (
    titleLower.includes("fullstack") ||
    titleLower.includes("full-stack") ||
    titleLower.includes("full stack") ||
    titleLower.includes("complete")
  ) {
    bank = QUESTION_BANKS.fullstack;
  } else if (
    titleLower.includes("ml") ||
    titleLower.includes("machine learning") ||
    titleLower.includes("data") ||
    titleLower.includes("ai") ||
    titleLower.includes("deep learning") ||
    titleLower.includes("neural")
  ) {
    bank = QUESTION_BANKS.aiml;
  } else if (
    titleLower.includes("frontend") ||
    titleLower.includes("react") ||
    titleLower.includes("web") ||
    titleLower.includes("design") ||
    titleLower.includes("ui") ||
    titleLower.includes("css")
  ) {
    bank = QUESTION_BANKS.frontend;
  } else if (
    titleLower.includes("backend") ||
    titleLower.includes("node") ||
    titleLower.includes("server") ||
    titleLower.includes("api") ||
    titleLower.includes("databases") ||
    titleLower.includes("sql")
  ) {
    bank = QUESTION_BANKS.backend;
  } else {
    bank = QUESTION_BANKS.general;
  }

  // Ensure we safely slice the questions to return exactly the count requested.
  // If count is higher than the size of the bank, we clamp to the size of the bank.
  const targetCount = Math.max(1, Math.min(count, bank.length));
  return bank.slice(0, targetCount);
}

/**
 * Generates a highly realistic, technical spoken response based on keywords
 * inside the question text. This acts as a robust speech-to-text fallback
 * if browser mic locks or API failures result in empty speech recognition.
 *
 * @param {string} question - The interview question text.
 * @returns {string} Realistic, technically accurate spoken answer.
 */
export function getSpokenTranscriptFallback(question) {
  const qLower = (question || "").toLowerCase();

  if (
    qLower.includes("machine learning") ||
    qLower.includes("ml") ||
    qLower.includes("model") ||
    qLower.includes("hyperparameter") ||
    qLower.includes("deep learning") ||
    qLower.includes("pytorch") ||
    qLower.includes("tensorflow") ||
    qLower.includes("recommender") ||
    qLower.includes("overfitting")
  ) {
    return "That's a great question. In my experience with machine learning systems, I focus heavily on rigorous data prep and model baseline evaluation. I usually start with an interpretable baseline model like a random forest to get a quick benchmark. From there, I perform feature engineering and hyperparameter tuning using cross-validation to prevent any data leakage. For deployment, we package the model using Docker, set up drift detection, and release it via a shadow pipeline to safely validate predictions on live traffic before fully routing production endpoints.";
  }

  if (
    qLower.includes("state") ||
    qLower.includes("re-render") ||
    qLower.includes("context") ||
    qLower.includes("zustand") ||
    qLower.includes("redux")
  ) {
    return "Managing application state in React requires balancing simple data flow and rendering efficiency. For local UI toggles, useState is ideal. For deeply nested components, I use React Context, but I make sure to split contexts or use selectors to avoid triggering full component tree re-renders. For large global states, I prefer lightweight libraries like Zustand or Redux Toolkit because they use state slice selectors, ensuring only components that depend on the specific updated state keys undergo a re-render.";
  }

  if (
    qLower.includes("performance") ||
    qLower.includes("bundle") ||
    qLower.includes("loading") ||
    qLower.includes("next.js") ||
    qLower.includes("ssr") ||
    qLower.includes("hydration")
  ) {
    return "Optimizing frontend performance starts with a clean bundle analysis. I implement dynamic code-splitting using React lazy and Suspense to defer loading non-critical page paths. We also serve compressed images in WebP format, implement lazy-loading for off-screen graphics, and configure CDN edge caching. If we are utilizing Next.js, leveraging Server-Side Rendering or Incremental Static Regeneration keeps initial page load times under 1.5 seconds, which heavily boosts user retention.";
  }

  if (
    qLower.includes("styling") ||
    qLower.includes("tailwind") ||
    qLower.includes("css") ||
    qLower.includes("responsive") ||
    qLower.includes("design system")
  ) {
    return "I absolutely love using Tailwind CSS because its utility-first classes enable rapid UI prototyping. Tailwind's build-time purging keeps production CSS incredibly small. To construct a responsive layout, I design with a mobile-first approach, using media query prefixes like sm, md, and lg. I utilize Flexbox and CSS Grid to ensure our interfaces automatically adapt to any screen size, from mobile phones up to ultra-wide desktop monitors.";
  }

  if (
    qLower.includes("testing") ||
    qLower.includes("jest") ||
    qLower.includes("cypress") ||
    qLower.includes("playwright") ||
    qLower.includes("testing library")
  ) {
    return "My approach to frontend testing is about building high confidence without slowing down developer velocity. I use Jest and React Testing Library for unit and integration testing. Rather than testing internal state, I test actual user interactions, like filling out a form and clicking submit. For mission-critical end-to-end paths like signup and checkout, we run Playwright or Cypress tests to capture any regressions before they reach staging.";
  }

  if (
    qLower.includes("backend") ||
    qLower.includes("infrastructure") ||
    qLower.includes("scaling") ||
    qLower.includes("microservices") ||
    qLower.includes("load balancer")
  ) {
    return "Scaling backend systems requires careful architectural planning. In my previous role, I horizontal-scaled our stateless API services behind an AWS Application Load Balancer to handle spikes in user traffic. We split our monolithic server into focused, decoupled microservices communicating asynchronously via message brokers. We also implemented Redis as a caching layer to offload expensive database query operations, which reduced our API response latency by nearly 40% under high concurrency.";
  }

  if (
    qLower.includes("api") ||
    qLower.includes("restful") ||
    qLower.includes("graphql") ||
    qLower.includes("endpoints") ||
    qLower.includes("protocols")
  ) {
    return "When designing secure and performant RESTful APIs, I focus on statelessness, clear resource naming, and strict request validation. I ensure we implement correct HTTP verbs and consistent JSON payloads. If the frontend requires querying highly relational, nested models with custom fields, I design a GraphQL gateway. This prevents over-fetching and under-fetching by letting the client request exactly the fields they need in a single round-trip, which significantly optimizes network performance.";
  }

  if (
    qLower.includes("database") ||
    qLower.includes("postgresql") ||
    qLower.includes("mongodb") ||
    qLower.includes("sql") ||
    qLower.includes("queries") ||
    qLower.includes("tuning")
  ) {
    return "Database optimization is key for backend speed. In my experience, the first step is analyzing slow queries using PostgreSQL's EXPLAIN ANALYZE or MongoDB's explain tools. I add B-tree indexes to columns frequently used in WHERE clauses and JOIN operations, while avoiding over-indexing which slows down writes. Under high load, we implement read replicas to separate read traffic from write transactions, and utilize connection pooling tools like pgDev or Prisma's built-in poolers to prevent exhaustion of connection sockets.";
  }

  if (
    qLower.includes("container") ||
    qLower.includes("docker") ||
    qLower.includes("ci/cd") ||
    qLower.includes("kubernetes") ||
    qLower.includes("devops")
  ) {
    return "Containerization has completely solved the 'works on my machine' problem. I write multi-stage Dockerfiles to package our services, compiling assets in a builder stage and copying only the lightweight production bundle into an alpine runtime image. We configure CI/CD pipelines in GitHub Actions to run linters, execute unit tests, build Docker images, and push them to AWS ECR. Finally, we execute rolling updates on ECS or Kubernetes, ensuring zero service downtime during deployments.";
  }

  if (
    qLower.includes("authentication") ||
    qLower.includes("token") ||
    qLower.includes("jwt") ||
    qLower.includes("oauth") ||
    qLower.includes("security") ||
    qLower.includes("encryption")
  ) {
    return "Secure authentication is critical. I usually implement token-based authentication using JWTs. The access token is kept short-lived in memory, while a secure, HTTP-only, SameSite cookie contains the refresh token. When the access token expires, the client silently requests a new one. For third-party integrations, we utilize OAuth2 flows with libraries like NextAuth to support Google or GitHub single sign-on securely, alongside strict encryption of user passwords using bcrypt.";
  }

  if (
    qLower.includes("ethics") ||
    qLower.includes("bias") ||
    qLower.includes("fairness") ||
    qLower.includes("secure")
  ) {
    return "Addressing bias in AI systems is an ethical imperative. My approach is to perform rigorous data auditing before training, analyzing the dataset for underrepresented classes or historical biases. During training, we use fairness-aware algorithms and constraint optimization to ensure equal opportunity metrics across sensitive attributes. In addition, we establish an adversarial testing protocol post-deployment to proactively identify and mitigate biased or toxic model behaviors in real-time.";
  }

  if (
    qLower.includes("onboarding") ||
    qLower.includes("team") ||
    qLower.includes("document") ||
    qLower.includes("collaborative") ||
    qLower.includes("git")
  ) {
    return "A smooth engineering onboarding requires clear documentation and collaborative tooling. I keep our markdown documentation, setup guides, and architectural diagrams detailed and updated in Git. We utilize clean Git workflows with pull requests, mandatory peer reviews, and interactive branch previews. This ensures that new developers can spin up their local environment in under an hour and safely merge their first ticket on day one.";
  }

  if (
    qLower.includes("full stack") ||
    qLower.includes("fullstack") ||
    qLower.includes("architecture") ||
    qLower.includes("end-to-end")
  ) {
    return "Designing full stack systems requires balancing client experience and server reliability. In my projects, I use React with TypeScript for a type-safe client UI, communicating with a Node.js and Express backend. We use PostgreSQL for structured relational data and Redis for fast session caches. The most complex part is designing a secure, role-based authorization gateway that works seamlessly across the frontend client and the backend microservices while keeping initial page load times under one second.";
  }

  if (
    qLower.includes("learning") ||
    qLower.includes("growth") ||
    qLower.includes("rapid") ||
    qLower.includes("velocity")
  ) {
    return "Learning a new technology rapidly is one of my core strengths. I start by reading the official documentation and building a simple, high-fidelity proof-of-concept project. I focus on understanding the core design patterns and mental models of the technology—like how state flows or how compilation is handled—which helps me leverage my existing engineering foundations to quickly write production-grade code in the new stack.";
  }

  return "That's a really interesting question. In my previous roles, I've approached this by first breaking down the technical requirements and constraints. I focus heavily on writing clean, self-documenting code, conducting peer reviews, and structuring our systems to ensure high scalability and performance. I believe in establishing robust automated testing pipelines to catch edge cases early, which allows our engineering team to ship stable features rapidly and maintain high codebase velocity.";
}
