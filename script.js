document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       0. TEXT PRESSURE BANNER
       ========================================= */
    const tpMount = document.getElementById('text-pressure-mount');
    if (tpMount && window.TextPressure) {
        new TextPressure(tpMount, {
            text: 'Hello!',
            textColor: '#10b981',
            minFontSize: 20,
            width: true,
            weight: true,
            italic: false,
            alpha: false,
            scale: true
        });
    }

    /* =========================================
       1. THEME TOGGLING
       ========================================= */
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcons(newTheme);
        });
    }

    function updateThemeIcons(theme) {
        if (!sunIcon || !moonIcon) return;
        if (theme === 'light') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    /* =========================================
       2. LOADING SCREEN
       ========================================= */
    const loaderWrapper = document.getElementById('loader-wrapper');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    const loaderPercent = document.getElementById('loader-percent');

    if (loaderWrapper && loaderBar && loaderText && loaderPercent) {
        const alreadyLoaded = sessionStorage.getItem('portfolioLoaded');
        if (alreadyLoaded) {
            loaderWrapper.style.display = 'none';
        } else {
            document.body.style.overflow = 'hidden';
            let progress = 0;
            const loadingPhrases = [
                "[SYSTEM INIT] Boot sequence started...",
                "[NET] Establishing secure connection...",
                "[FW] Bypassing mainframe protocols...",
                "[ENC] Decrypting cryptographic keys...",
                "[UI] Loading portfolio modules...",
                "[OK] Access granted. Welcome."
            ];

            const loadingInterval = setInterval(() => {
                progress += Math.floor(Math.random() * 12) + 4;
                if (progress > 100) progress = 100;

                loaderBar.style.width = progress + '%';
                loaderPercent.textContent = progress;

                if (progress < 20) loaderText.textContent = loadingPhrases[0];
                else if (progress < 40) loaderText.textContent = loadingPhrases[1];
                else if (progress < 60) loaderText.textContent = loadingPhrases[2];
                else if (progress < 80) loaderText.textContent = loadingPhrases[3];
                else if (progress < 100) loaderText.textContent = loadingPhrases[4];
                else loaderText.textContent = loadingPhrases[5];

                if (progress === 100) {
                    clearInterval(loadingInterval);
                    setTimeout(() => {
                        loaderWrapper.style.opacity = '0';
                        loaderWrapper.style.pointerEvents = 'none';
                        setTimeout(() => {
                            loaderWrapper.style.display = 'none';
                            document.body.style.overflow = '';
                            sessionStorage.setItem('portfolioLoaded', 'true');
                        }, 800);
                    }, 2500);
                }
            }, 160);
        }
    }

    /* =========================================
       3. MOBILE MENU
       ========================================= */
    const menuBtn = document.querySelector('.menu-btn');
    const navMenuContainer = document.querySelector('.nav-links'); // Fixed duplicate name
    if (menuBtn && navMenuContainer) {
        menuBtn.addEventListener('click', () => {
            navMenuContainer.classList.toggle('show');
            menuBtn.setAttribute('aria-expanded', navMenuContainer.classList.contains('show'));
        });
    }

    /* =========================================
       4. FORM SUBMISSION (GMAIL ROUTING)
       ========================================= */
    // 💡 TO RECEIVE MESSAGES DIRECTLY TO YOUR GMAIL:
    // 1. Go to https://web3forms.com/ and enter your Gmail: ahmadainulafeeq@gmail.com
    // 2. You will instantly get a free Access Key in your inbox.
    // 3. Paste that Access Key below (replace 'YOUR_ACCESS_KEY_HERE'):
    const WEB3FORMS_ACCESS_KEY = '6b3c1632-4f17-40f9-b1b5-f3b703922c0d';

    const contactForms = document.querySelectorAll('form');
    contactForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.minimal-send-btn');
            if (!submitBtn) return;
            const originalText = submitBtn.textContent || 'Send Message';

            submitBtn.textContent = 'Sending...';
            submitBtn.style.opacity = '0.7';
            submitBtn.disabled = true;

            const nameInput = form.querySelector('[name="name"]');
            const emailInput = form.querySelector('[name="email"]');
            const subjectInput = form.querySelector('[name="subject"]');
            const messageInput = form.querySelector('[name="message"]');

            const payload = {
                name:    nameInput ? nameInput.value.trim() : '',
                email:   emailInput ? emailInput.value.trim() : '',
                subject: subjectInput ? subjectInput.value.trim() : 'Portfolio Contact Message',
                message: messageInput ? messageInput.value.trim() : ''
            };

            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const useWeb3Forms = WEB3FORMS_ACCESS_KEY && WEB3FORMS_ACCESS_KEY !== 'YOUR_ACCESS_KEY_HERE';

            try {
                if (useWeb3Forms) {
                    // Send to Gmail via Web3Forms API
                    const res = await fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            access_key: WEB3FORMS_ACCESS_KEY,
                            from_name: 'Portfolio Contact Form',
                            ...payload
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess(submitBtn, form);
                    } else {
                        throw new Error(data.message || 'Web3Forms error');
                    }
                } else if (isLocalhost) {
                    // Fallback to local Express server during local development
                    const res = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess(submitBtn, form);
                    } else {
                        throw new Error(data.error || 'Server error');
                    }
                } else {
                    // Alert popup detailing how to activate Gmail live
                    alert('🔑 Contact Form Setup Needed:\n\nTo receive messages directly to your Gmail on your live website:\n1. Go to web3forms.com\n2. Enter ahmadainulafeeq@gmail.com to get a free Access Key\n3. Paste the key inside public/script.js!\n\n(Local fallback: works on localhost)');
                    throw new Error('Web3Forms key missing');
                }
            } catch (err) {
                submitBtn.textContent = '✖ Failed';
                if (submitBtn.classList.contains('minimal-send-btn')) {
                    submitBtn.style.color = '#ef4444';
                } else {
                    submitBtn.style.background = '#ef4444';
                }
                submitBtn.style.opacity = '1';
                console.error('Contact form submission failed:', err);
            } finally {
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.style.opacity = '';
                    submitBtn.disabled = false;
                }, 4000);
            }
        });
    });

    function showSuccess(btn, form) {
        btn.textContent = '✔ Message Sent!';
        if (btn.classList.contains('minimal-send-btn')) {
            btn.style.color = '#10b981';
        } else {
            btn.style.background = '#10b981';
        }
        btn.style.opacity = '1';
        form.reset();
    }

    /* =========================================
       5. DYNAMIC TYPING HERO
       ========================================= */
    const dynamicTextElement = document.getElementById('dynamic-text');
    if (dynamicTextElement) {
        const phrases = ["Cyber Security Student", "Programmer", "Web Developer", "Gamer", "Video Editor", "YouTuber", "UI/UX Designer", "Vibe Coder"];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentPhrase = phrases[phraseIndex];
            if (isDeleting) {
                dynamicTextElement.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
            } else {
                dynamicTextElement.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
            }

            let typeSpeed = isDeleting ? 50 : 100;
            if (!isDeleting && charIndex === currentPhrase.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typeSpeed = 500;
            }
            setTimeout(type, typeSpeed);
        }
        setTimeout(type, 500);
    }



    /* =========================================
       6. FAST HACKING TERMINAL 
       ========================================= */
    const terminalContent = document.getElementById('terminal-content');
    if (terminalContent) {
        const hackingStrings = [
            "0x89F3A1", "system.bypass()", "encrypt_rsa(2048)", "kernel_panic",
            "SSH_AUTH_SOCK", "root@kali:~#", "nmap -sS -p- 10.0.0.1",
            "Injection successful", "01101001 01101110", "buffer_overflow",
            "sudo rm -rf /*", "connection_established", "auth_token_grabbed",
            "tcpdump -i eth0", "wireshark_capture", "0x00000000", "DATA_STREAM"
        ];

        setInterval(() => {
            const line = document.createElement('div');
            let text = "";
            for (let i = 0; i < 4; i++) {
                text += hackingStrings[Math.floor(Math.random() * hackingStrings.length)] + " ";
                text += Math.random().toString(36).substring(2, 6) + " ";
            }
            line.textContent = `> ${text}`;
            line.style.fontFamily = "monospace";
            line.style.fontSize = "0.9rem";
            line.style.marginBottom = "2px";
            line.style.color = 'var(--text-muted-dark)';
            if (Math.random() > 0.8) line.style.color = 'var(--text-light)';

            terminalContent.appendChild(line);
            terminalContent.parentElement.scrollTop = terminalContent.parentElement.scrollHeight;

            if (terminalContent.childNodes.length > 25) {
                terminalContent.removeChild(terminalContent.firstChild);
            }
        }, 60);
    }

    /* =========================================
       7. SCROLL REVEAL (UP & DOWN)
       ========================================= */
    const observerOptions = { threshold: 0.05, rootMargin: '0px 0px -40px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.slide-in-right').forEach((el) => {
        observer.observe(el);
    });

    /* =========================================
       8. SCROLL PROGRESS BAR & NAV SPY
       ========================================= */
    const progressBar = document.getElementById('scroll-progress');
    const sections = document.querySelectorAll("section");
    const navAnchorLinks = document.querySelectorAll(".nav-links a"); // Fixed duplicate name

    function handleScroll() {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        if (progressBar) progressBar.style.width = scrollPercentage + '%';

        let currentSection = "";
        sections.forEach((section) => {
            if (window.scrollY >= section.offsetTop - 200) {
                currentSection = section.getAttribute("id");
            }
        });
        navAnchorLinks.forEach((link) => {
            link.classList.remove("active");
            if (currentSection && link.getAttribute("href") === `#${currentSection}`) {
                link.classList.add("active");
            }
        });
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    /* =========================================
       9. LIQUID ETHER BACKGROUND
       ========================================= */
    const liquidBg = document.getElementById('liquid-bg');
    if (liquidBg && window.LiquidEther) {
        new LiquidEther(liquidBg, {
            colors: ['#064e3b', '#10b981', '#34d399', '#06b6d4', '#a7f3d0'],
            mouseForce: 15,          // Slower, more elegant mouse reaction (was 25)
            cursorSize: 100,
            resolution: 0.3,        
            autoDemo: true,
            autoSpeed: 0.15,        // Relaxing slow-flow auto speed (was 0.4)
            autoIntensity: 0.8,     // Gentle automatic movement force (was 2.0)
            autoResumeDelay: 2000,
            autoRampDuration: 0.8,
            BFECC: false,           
            isViscous: false,
            iterationsPoisson: 16   
        });
    }

    /* =========================================
       10. ULTRA-SMOOTH CYBER CURSOR 
       ========================================= */
    if (!document.querySelector('.cyber-cursor')) {
        const outline = document.createElement('div');
        outline.classList.add('cyber-cursor');
        document.body.appendChild(outline);

        const dot = document.createElement('div');
        dot.classList.add('cyber-cursor-dot');
        document.body.appendChild(dot);
    }

    const cursorOutline = document.querySelector('.cyber-cursor');
    const cursorDot = document.querySelector('.cyber-cursor-dot');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outlineX = mouseX;
    let outlineY = mouseY;

    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function renderCursor() {
        cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        outlineX += (mouseX - outlineX) * 0.25;
        outlineY += (mouseY - outlineY) * 0.25;
        cursorOutline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0)`;
        requestAnimationFrame(renderCursor);
    }
    renderCursor();

    const hoverables = document.querySelectorAll('a, button, .inner-card, .glass-card, .tech-badge');
    hoverables.forEach(element => {
        element.addEventListener('mouseenter', () => cursorOutline.classList.add('cursor-hover'));
        element.addEventListener('mouseleave', () => cursorOutline.classList.remove('cursor-hover'));
    });

    /* =========================================
       11. REAL-TIME PERSISTENT VISITOR COUNTER
       ========================================= */
    const visitorCountVal = document.getElementById('visitor-count-val');
    if (visitorCountVal) {
        // Determine whether to increment (only once per session visit)
        const hasVisitedThisSession = sessionStorage.getItem('hasVisitedThisSession');
        let apiUrl = '/api/visitor-count';
        if (!hasVisitedThisSession) {
            apiUrl += '?inc=true';
            sessionStorage.setItem('hasVisitedThisSession', 'true');
        }

        fetch(apiUrl)
            .then(res => {
                if (!res.ok) throw new Error('API not available');
                return res.json();
            })
            .then(data => {
                if (data && typeof data.count === 'number') {
                    animateNumberRoll(visitorCountVal, 0, data.count);
                } else {
                    throw new Error('Invalid response');
                }
            })
            .catch(err => {
                // Graceful fallback for Live Server & Static hosting (GitHub Pages)
                console.warn('Backend API unavailable. Falling back to local sessionStorage tracking.');
                
                let localCount = Number(localStorage.getItem('localVisitorCount')) || 0;
                if (!hasVisitedThisSession) {
                    localCount++;
                    localStorage.setItem('localVisitorCount', localCount);
                }
                
                // Show local visitor count instead of "ERROR"
                animateNumberRoll(visitorCountVal, 0, localCount);
            });
    }

    function animateNumberRoll(element, start, end) {
        let current = start;
        const duration = 1200; // ms
        const frameRate = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameRate);
        const increment = (end - start) / totalFrames;
        let frame = 0;

        function update() {
            frame++;
            current += increment;
            if (frame >= totalFrames) {
                element.textContent = String(end).padStart(6, '0');
            } else {
                element.textContent = String(Math.floor(current)).padStart(6, '0');
                requestAnimationFrame(update);
            }
        }
        update();
    }

    /* =========================================
       12. SPOTLIGHT CARD INTERACTIVE EFFECT
       ========================================= */
    function initSpotlightCards() {
        const spotlightCards = document.querySelectorAll('.spotlight-card');
        spotlightCards.forEach(card => {
            let spotlight = card.querySelector('.spotlight-overlay');
            if (!spotlight) {
                spotlight = document.createElement('div');
                spotlight.className = 'spotlight-overlay';
                card.appendChild(spotlight);
            }

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Track spotlight overlay position and make it visible
                spotlight.style.opacity = '1';
                spotlight.style.background = `radial-gradient(circle at ${x}px ${y}px, var(--primary-color) 0%, rgba(16, 185, 129, 0.1) 40%, transparent 80%)`;
            });

            card.addEventListener('mouseleave', () => {
                spotlight.style.opacity = '0';
            });
        });
    }
    initSpotlightCards();

    /* =========================================
       13. CERTIFICATE FILTER & PREVIEW MODAL
       ========================================= */
    const filterButtons = document.querySelectorAll('.filter-btn');
    const certCards = document.querySelectorAll('.cert-card');

    if (filterButtons.length > 0 && certCards.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle active filter button
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                // Filter cards with a beautiful CSS transition scale animation
                certCards.forEach(card => {
                    const categories = card.getAttribute('data-category').split(' ');
                    
                    if (filterValue === 'all' || categories.includes(filterValue)) {
                        card.style.display = 'flex';
                        // Trigger reflow for transition
                        void card.offsetWidth;
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        // Wait for transition before hiding
                        setTimeout(() => {
                            if (card.style.opacity === '0') {
                                card.style.display = 'none';
                            }
                        }, 300);
                    }
                });
            });
        });
    }

    // Modal Interaction
    const certModal = document.getElementById('certModal');
    if (certModal) {
        document.body.appendChild(certModal);
    }
    const certModalContainer = document.getElementById('certModalContainer');
    const certModalTitle = document.getElementById('certModalTitle');
    const certModalIframe = document.getElementById('certModalIframe');
    const certModalClose = document.getElementById('certModalClose');

    if (certModal && certModalClose && certModalIframe) {
        // Open Modal when a cert-card is clicked
        certCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Prevent trigger if clicking on download link inside actions
                if (e.target.closest('.cert-actions') || e.target.closest('.cert-action-btn')) {
                    return;
                }

                const file = card.getAttribute('data-file');
                const title = card.getAttribute('data-title');
                const orientation = card.getAttribute('data-orientation') || 'landscape';

                // Set content and configuration
                certModalTitle.textContent = title;
                certModalIframe.src = `${file}#toolbar=0`;
                
                // Adjust modal container size according to orientation (portrait / landscape)
                certModalContainer.className = `cert-modal-container ${orientation}`;

                // Show modal
                certModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock background scroll
            });
        });

        // Close Modal
        function closeModal() {
            certModal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scroll
            // Wait for transition to clear iframe src to avoid noise/flicker
            setTimeout(() => {
                certModalIframe.src = '';
            }, 400);
        }

        certModalClose.addEventListener('click', closeModal);
        
        // Close modal on backdrop click
        certModal.addEventListener('click', (e) => {
            if (e.target === certModal) {
                closeModal();
            }
        });

        // Close modal on Escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && certModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // Initialize Circular Gallery for Hobbies & Interests if container exists
    const galleryContainer = document.getElementById('circular-gallery-container');
    if (galleryContainer) {
        import('./CircularGallery.js')
            .then(module => {
                new module.CircularGallery(galleryContainer, {
                    bend: 3,
                    textColor: '#ffffff',
                    borderRadius: 0.05,
                    scrollSpeed: 1.2,
                    scrollEase: 0.02
                });
            })
            .catch(err => console.error("Failed to load CircularGallery:", err));
    }

    // Initialize premium holographic ProfileCard if mount exists
    const cardMount = document.getElementById('profile-card-mount');
    if (cardMount) {
        import('./ProfileCard.js')
            .then(module => {
                new module.ProfileCard(cardMount, {
                    name: 'Ahmad Ainul Afeeq',
                    title: 'Cyber Security Student & Developer',
                    handle: 'ainulafeeq',
                    status: 'Online',
                    contactText: 'Contact Me',
                    avatarUrl: 'assets/images/profile-picture.png',
                    showUserInfo: false,
                    enableTilt: true,
                    enableMobileTilt: false,
                    behindGlowEnabled: true,
                    behindGlowColor: 'rgba(16, 185, 129, 0.4)',
                    innerGradient: 'linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.2) 100%)'
                });
            })
            .catch(err => console.error("Failed to load ProfileCard:", err));
    }
});