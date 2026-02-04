6// Enhanced project display with improved animations and data management
document.addEventListener('DOMContentLoaded', function () {
  // Fetch project data from JSON file
  fetch('projects.json')
    .then(response => response.json())
    .then(data => {
      const novemberProjects = data.novemberProjects;
      const decemberProjects = data.decemberProjects;

      // Store all projects for filtering
      const allProjects = [...novemberProjects, ...decemberProjects];
      const container = document.getElementById("projectContainer");

      // Render all projects initially
      renderProjects(novemberProjects, decemberProjects, container);

      // Add filter event listeners
      const filterButtons = document.querySelectorAll('.filter-btn');
      if (filterButtons.length) {
        filterButtons[0].classList.add('filter-selected');
      }
      filterButtons.forEach(button => {
        button.addEventListener('click', function () {
          // Update selected button
          filterButtons.forEach(btn => btn.classList.remove('filter-selected'));
          this.classList.add('filter-selected');

          // Filter projects based on button data-filter attribute
          const filter = this.dataset.filter;
          filterProjects(filter, allProjects, container);
        });
      });

      // Add search functionality
      const searchInput = document.getElementById('searchInput');
      searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        searchProjects(searchTerm, allProjects, container);
      });

      // Initialize Lucide icons after DOM content is loaded
      lucide.createIcons();

      // Add tooltip functionality for technology badges
      addTooltipFunctionality();
    })
    .catch(error => {
      console.error('Error loading project data:', error);
      // Fallback to original implementation if JSON loading fails
      loadProjectsFallback();
    });
});

// Function to render projects
function renderProjects(novemberProjects, decemberProjects, container) {
  // Clear container
  container.innerHTML = '';

  // Add November projects section
  const novHeader = document.createElement("div");
  novHeader.className = "col-span-full mb-4";
  novHeader.innerHTML = `
    <h2 class="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">November</h2>
  `;
  container.appendChild(novHeader);

  novemberProjects.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = `bg-white p-5 rounded-xl shadow-md border border-gray-200 card-animate ease-[cubic-bezier(0.25,0.8,0.25,1)] opacity-0 translate-y-5`;
    card.style.setProperty('--item-index', i);
    card.dataset.cardIndex = i;

    // Create technology badges
    let techBadges = '';
    p.technologies.forEach(tech => {
      techBadges += `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 transition-all duration-200 cursor-pointer hover:bg-blue-500 hover:text-white hover:-translate-y-0.5 hover:shadow-md" data-tech="${tech}">${tech}</span>`;
    });

    card.innerHTML = `
      <h2 class="project-title mb-3 flex items-center gap-2">
        <i data-lucide="folder" class="w-5 h-5 text-gray-700"></i>
        ${p.name}
      </h2>

      <div class="mb-3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 transition-all duration-300 overflow-hidden" style="height: 150px;">
        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:scale-105 cursor-pointer">
      </div>

      <div class="space-y-1 text-sm text-gray-700 mb-3">
        <p class="flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <strong>Estimated:</strong> ${p.estimated}
        </p>
        <p class="flex items-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4 text-green-600"></i>
          <strong>Delivered:</strong> ${p.delivered}
        </p>
      </div>

      <p class="text-sm text-gray-800 mb-3 leading-snug">
        ${p.description}
      </p>

      <div class="mb-3">
        <div class="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>${p.completionPercentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 transition-all duration-300 progress-track">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300 progress-fill" style="--progress: ${p.completionPercentage}%;"></div>
        </div>
      </div>

      <div class="mb-3 hidden">
        <div>
          ${techBadges}
        </div>
      </div>

      <div class="mt-2">
        <span class="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit transition-all duration-300 hover:scale-105
          ${p.status === 'completed' ? "bg-green-200 text-green-800" : p.status === 'in-progress' ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-800"}">
          <i data-lucide="${p.status === 'completed' ? "check-circle" : p.status === 'in-progress' ? "clock" : "circle"}" class="w-4 h-4"></i>
          ${p.status === 'completed' ? "Delivered" : p.status === 'in-progress' ? "In Progress" : "Not Started"}
        </span>
      </div>
    `;

    container.appendChild(card);

    // Staggered fade-in animation
    setTimeout(() => {
      card.classList.add("!opacity-100", "!translate-y-0");
    }, 100 * i);
  });

  // Add December projects section
  const decHeader = document.createElement("div");
  decHeader.className = "col-span-full mb-4";
  decHeader.innerHTML = `
    <h2 class="text-xl font-bold text-gray-800 border-b-2 border-orange-500 pb-2 mb-4">December</h2>
  `;
  container.appendChild(decHeader);

  decemberProjects.forEach((p, i) => {
    const status =
      p.status ||
      (p.delivered && p.delivered.toLowerCase().includes('progress')
        ? 'in-progress'
        : p.delivered && p.delivered.toLowerCase().includes('delivered')
          ? 'completed'
          : 'not-started');

    const card = document.createElement("div");
    card.className = `bg-white p-5 rounded-xl shadow-md border border-gray-200 card-animate ease-[cubic-bezier(0.25,0.8,0.25,1)] opacity-0 translate-y-5`;
    card.style.setProperty('--item-index', i + novemberProjects.length);
    card.dataset.cardIndex = i + novemberProjects.length;

    // Create technology badges
    let techBadges = '';
    p.technologies.forEach(tech => {
      techBadges += `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 transition-all duration-200 cursor-pointer hover:bg-blue-500 hover:text-white hover:-translate-y-0.5 hover:shadow-md" data-tech="${tech}">${tech}</span>`;
    });

    card.innerHTML = `
      <h2 class="project-title mb-3 flex items-center gap-2">
        <i data-lucide="folder-plus" class="w-5 h-5 text-gray-700"></i>
        ${p.name}
      </h2>

      <div class="mb-3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 transition-all duration-300 overflow-hidden" style="height: 150px;">
        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:scale-105 cursor-pointer">
      </div>

      <div class="space-y-1 text-sm text-gray-700 mb-3">
        <p class="flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <strong>Estimated:</strong> ${p.estimated}
        </p>
        <p class="flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i>
          <strong>Status:</strong> ${p.delivered}
        </p>
      </div>

      <p class="text-sm text-gray-800 mb-3 leading-snug">
        ${p.description}
      </p>

      <div class="mb-3">
        <div class="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>${p.completionPercentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 transition-all duration-300 progress-track">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300 progress-fill" style="--progress: ${p.completionPercentage}%;"></div>
        </div>
      </div>

      <div class="mb-3 hidden">
        <div>
          ${techBadges}
        </div>
      </div>

      <div class="mt-2">
        <span class="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit transition-all duration-300 hover:scale-105
          ${status === 'completed' ? "bg-green-200 text-green-800" : status === 'in-progress' ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-800"}">
          <i data-lucide="${status === 'completed' ? "check-circle" : status === 'in-progress' ? "clock" : "calendar"}" class="w-4 h-4"></i>
          ${status === 'completed' ? "Delivered" : status === 'in-progress' ? "In Progress" : "Upcoming"}
        </span>
      </div>
    `;

    container.appendChild(card);

    // Staggered fade-in animation
    setTimeout(() => {
      card.classList.add("!opacity-100", "!translate-y-0");
    }, 100 * (i + novemberProjects.length));
  });

  // Reinitialize Lucide icons
  lucide.createIcons();

  // Add tooltip functionality for technology badges
  addTooltipFunctionality();
}

// Function to filter projects
function filterProjects(filter, allProjects, container) {
  let filteredNovember = [];
  let filteredDecember = [];

  switch (filter) {
    case 'all':
      filteredNovember = allProjects.filter(p => p.id <= 4);
      filteredDecember = allProjects.filter(p => p.id > 4);
      break;
    case 'games':
      filteredNovember = allProjects.filter(p => p.id <= 4 && (p.name.includes('Game') || p.name.includes('Pump')));
      filteredDecember = allProjects.filter(p => p.id > 4 && (p.name.includes('Game') || p.name.includes('Pump')));
      break;
    case 'web':
      filteredNovember = allProjects.filter(p => p.id <= 4 && (p.name.includes('DIFC') || p.name.includes('Ticketing')));
      filteredDecember = allProjects.filter(p => p.id > 4 && (p.name.includes('DIFC') || p.name.includes('Ticketing')));
      break;
    case 'erp':
      filteredNovember = [];
      filteredDecember = allProjects.filter(p => p.id > 4 && p.name.includes('Odoo'));
      break;
    case 'completed':
      filteredNovember = allProjects.filter(p => p.id <= 4);
      filteredDecember = [];
      break;
    case 'in-progress':
      filteredNovember = [];
      filteredDecember = allProjects.filter(p => p.id > 4 && p.status === 'in-progress');
      break;
  }

  renderProjects(filteredNovember, filteredDecember, container);
}

// Function to search projects
function searchProjects(searchTerm, allProjects, container) {
  if (!searchTerm) {
    // If search term is empty, show all projects
    const novemberProjects = allProjects.filter(p => p.id <= 4);
    const decemberProjects = allProjects.filter(p => p.id > 4);
    renderProjects(novemberProjects, decemberProjects, container);
    return;
  }

  const filteredProjects = allProjects.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm) ||
    p.technologies.some(tech => tech.toLowerCase().includes(searchTerm))
  );

  const filteredNovember = filteredProjects.filter(p => p.id <= 4);
  const filteredDecember = filteredProjects.filter(p => p.id > 4);

  renderProjects(filteredNovember, filteredDecember, container);
}

// Fallback function if JSON loading fails
function loadProjectsFallback() {
  /* ============================
     EDIT YOUR PROJECTS HERE
  ============================ */
  // November 2025 projects (adding 1 week to each)
  const novemberProjects = [
    {
      name: "Ball Pump – Interactive Game",
      estimated: "5 weeks",
      delivered: "2 weeks",
      description:
        "End-to-end development of a custom C++ game integrated with an Arduino-based pressure sensor. The sensor captures real-time air pressure and sends values directly to the game, enabling physical interaction. Technologies used: C++, Arduino, Unity. Estimated duration: 5 weeks. Delivered in 2 weeks, on time and ahead of schedule. Responsible for UI, UX, game graphics, and visual effects."
    },
    {
      name: "Immersive Room – Full-Body Tracking Game (v1)",
      estimated: "5 weeks",
      delivered: "2 weeks",
      description:
        "First version of an immersive room experience with full-body tracking, allowing players to interact and move naturally inside the game environment. Technologies used: Unity, C++, Arduino. Estimated duration: 5 weeks. Delivered in 2 weeks, on time and ahead of expectations. Led the UI and UX design, as well as the visual and graphic design for the player interface and in-room visuals."
    },
    {
      name: "DIFC – Real-Time Quiz System",
      estimated: "2 weeks",
      delivered: "4 days",
      description:
        "Development of a real-time quiz platform similar to Kahoot, where many users can join from their phones, answer questions simultaneously, and see results on a main screen. Technologies used: JavaScript, WebSocket, MongoDB. Estimated duration: 2 weeks. Delivered in 4 days, fully on time. Includes an admin panel to create and edit quizzes, manage sessions, and monitor live results. In charge of UI, UX, and visual design."
    },
    {
      name: "Event Ticketing System",
      estimated: "3 weeks",
      delivered: "1 week",
      description:
        "Creation of a ticketing system for events, allowing users to register, log in, purchase tickets, and then download or print them. Technologies used: React, Express, MySQL. Estimated duration: 3 weeks. Delivered in 1 week, on time and ahead of schedule. Admins can create and manage events, customize ticket designs, and track performance via a real-time dashboard. Responsible for UI, UX, and overall visual design."
    }
  ];

  // December 2025 projects (upcoming)
  const decemberProjects = [
    {
      name: "Cycle Game - Rebuild",
      estimated: "5 weeks",
      delivered: "Delivered",
      description:
        "Rebuild the 'Cycle Game' with Arduino connection and develop a new game platform with a new API server on no1events server. Technologies to be used: Unity, Arduino, C++, API development. Estimated duration: 5 weeks. I will make it in 3 weeks. This project involves creating a completely new platform with enhanced features and better performance."
    },
    {
      name: "Fast Feet Game - Rebuild",
      estimated: "4 weeks",
      delivered: "In progress",
      description:
        "Rebuild the 'Fast Feet' game with Arduino connected to sensors and lights. Technologies to be used: Arduino, C++, Unity, sensor integration. Estimated duration: 4 weeks. I will make it in 3 weeks. This project involves creating a responsive game that reacts to player movements through sensor inputs."
    },
    {
      name: "NHRI – National Human Rights Institution",
      estimated: "3 weeks",
      delivered: "Delivered",
      description:
        "Rebrand and extend the quiz/engagement app for the National Human Rights Institution, updating all questions and answers for the new program, adding institution branding, and launching as a refreshed web app experience."
    },
    {
      name: "UAE Pro League – History Web",
      estimated: "4 weeks",
      delivered: "Delivered",
      description:
        "A bilingual (Arabic/English) history experience for the UAE Pro League with club trophies, competition timelines, and tournament cards inspired by the official brand visuals. Includes rich media, season archives, and an interactive landing selector for each cup."
    }
  ];

  const container = document.getElementById("projectContainer");

  // Add November projects section
  const novHeader = document.createElement("div");
  novHeader.className = "col-span-full mb-4";
  novHeader.innerHTML = `
    <h2 class="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2">November</h2>
  `;
  container.appendChild(novHeader);

  novemberProjects.forEach((p, i) => {
    // All projects are delivered on time
    const onTime = true;

    // Map project names to image files
    let projectImage = '';
    if (p.name.includes('Ball Pump')) {
      projectImage = 'ballpump.png';
    } else if (p.name.includes('Immersive Room')) {
      projectImage = 'immersive.png';
    } else if (p.name.includes('DIFC')) {
      projectImage = 'difc.png';
    } else if (p.name.includes('Ticketing')) {
      projectImage = 'ticketing.png';
    }

    const card = document.createElement("div");
    card.className = `bg-white p-5 rounded-xl shadow-md border border-gray-200 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] opacity-0 translate-y-5`;
    card.style.setProperty('--item-index', i);
    card.dataset.cardIndex = i;

    card.innerHTML = `
      <h2 class="project-title mb-3 flex items-center gap-2">
        <i data-lucide="folder" class="w-5 h-5 text-gray-700"></i>
        ${p.name}
      </h2>

      <div class="mb-3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 transition-all duration-300 overflow-hidden" style="height: 150px;">
        ${projectImage ?
        `<img src="${projectImage}" alt="${p.name}" class="w-full h-full object-cover transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:scale-105 cursor-pointer">` :
        `<div class="text-gray-400 text-center p-4">
            <i data-lucide="image" class="w-8 h-8 mx-auto mb-2"></i>
            <p class="text-sm">Project Image</p>
          </div>`
      }
      </div>

      <div class="space-y-1 text-sm text-gray-700 mb-3">
        <p class="flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <strong>Estimated:</strong> ${p.estimated}
        </p>
        <p class="flex items-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4 text-green-600"></i>
          <strong>Delivered:</strong> ${p.delivered}
        </p>
      </div>

      <p class="text-sm text-gray-800 mb-3 leading-snug">
        ${p.description}
      </p>

      <div class="mt-2">
        <span class="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit transition-all duration-300 hover:scale-105
          ${onTime ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}">
          <i data-lucide="${onTime ? "check-circle" : "alert-triangle"}" class="w-4 h-4"></i>
          ${onTime ? "Delivered" : "Late Delivery"}
        </span>
      </div>
    `;

    container.appendChild(card);

    // Staggered fade-in animation
    setTimeout(() => {
      card.classList.add("!opacity-100", "!translate-y-0");
    }, 100 * i);
  });

  // Add December projects section
  const decHeader = document.createElement("div");
  decHeader.className = "col-span-full mb-4";
  decHeader.innerHTML = `
    <h2 class="text-xl font-bold text-gray-800 border-b-2 border-orange-500 pb-2">December</h2>
  `;
  container.appendChild(decHeader);

  decemberProjects.forEach((p, i) => {
    const status =
      p.delivered && p.delivered.toLowerCase().includes('progress')
        ? 'in-progress'
        : p.delivered && p.delivered.toLowerCase().includes('delivered')
          ? 'completed'
          : 'not-started';

    const card = document.createElement("div");
    card.className = `bg-white p-5 rounded-xl shadow-md border border-gray-200 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] opacity-0 translate-y-5`;
    card.style.setProperty('--item-index', i + novemberProjects.length);
    card.dataset.cardIndex = i + novemberProjects.length;

    card.innerHTML = `
      <h2 class="project-title mb-3 flex items-center gap-2">
        <i data-lucide="folder-plus" class="w-5 h-5 text-gray-700"></i>
        ${p.name}
      </h2>

      <div class="mb-3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 transition-all duration-300 overflow-hidden" style="height: 150px;">
        <img src="logo.png" alt="${p.name}" class="w-full h-full object-cover transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:scale-105 cursor-pointer">
      </div>

      <div class="space-y-1 text-sm text-gray-700 mb-3">
        <p class="flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <strong>Estimated:</strong> ${p.estimated}
        </p>
        <p class="flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i>
          <strong>Status:</strong> ${p.delivered}
        </p>
      </div>

      <p class="text-sm text-gray-800 mb-3 leading-snug">
        ${p.description}
      </p>

      <div class="mt-2">
        <span class="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit transition-all duration-300 hover:scale-105
          ${status === 'completed' ? "bg-green-200 text-green-800" : status === 'in-progress' ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-800"}">
          <i data-lucide="${status === 'completed' ? "check-circle" : status === 'in-progress' ? "clock" : "calendar"}" class="w-4 h-4"></i>
          ${status === 'completed' ? "Delivered" : status === 'in-progress' ? "In Progress" : "Upcoming"}
        </span>
      </div>
    `;

    container.appendChild(card);

    // Staggered fade-in animation
    setTimeout(() => {
      card.classList.add("!opacity-100", "!translate-y-0");
    }, 100 * (i + novemberProjects.length));
  });

  // Initialize Lucide icons after DOM content is loaded
  lucide.createIcons();
}

// Add tooltip functionality for technology badges
function addTooltipFunctionality() {
  const techBadges = document.querySelectorAll('.tech-badge');
  techBadges.forEach(badge => {
    badge.addEventListener('mouseenter', function (e) {
      // In a real implementation, you could show detailed info about the technology
      console.log(`Technology: ${e.target.dataset.tech}`);
    });
  });
}
