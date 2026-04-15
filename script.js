import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let dynamicGeminiKey = '';

/** MNLAB Logic v1.2.0 - Clean Deployment **/
document.addEventListener('DOMContentLoaded', () => {
    
    // --- MNLAB Extreme Upgrade: 0. Helper Functions & Global State ---
    let currentTheme = localStorage.getItem('mnlab_theme') || 'dark';
    if (currentTheme === 'light') document.body.classList.add('light-theme');
    // 1. Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li a');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.querySelector('i').classList.toggle('fa-bars');
            hamburger.querySelector('i').classList.toggle('fa-times');
        });
    }

    // Close mobile menu when clicking a link
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.querySelector('i').classList.add('fa-bars');
                hamburger.querySelector('i').classList.remove('fa-times');
            }
        });
    });

    // 2. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 3. Highlight active section in navigation
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${current}`) {
                a.classList.add('active');
            }
        });
    });

    // 4. Scroll Reveal Animation using IntersectionObserver
    const revealElements = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // 5. Handling Form Submission dynamically (Placeholder)
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Getting the button inside the form
            const button = quoteForm.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            
            // Loading state
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
            button.style.opacity = '0.8';
            button.disabled = true;

            // Simulate API request delay
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check"></i> تم الإرسال بنجاح';
                button.style.background = 'linear-gradient(90deg, #11998e, #38ef7d)'; /* Green success gradient */
                quoteForm.reset();
                
                // Revert button after 3 seconds
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.background = '';
                    button.style.opacity = '1';
                    button.disabled = false;
                }, 3000);
            }, 1500);
        });
    }

    // 6. Modal and Order Service Logic
    const orderModal = document.getElementById('orderModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const serviceSelect = document.getElementById('serviceSelect');
    
    // Open Modal Function
    window.openModal = function(serviceValue = '') {
        if (orderModal) {
            orderModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            if (serviceValue && serviceSelect) {
                // Ensure the value exists in options before setting
                const optionExists = Array.from(serviceSelect.options).some(opt => opt.value === serviceValue);
                if (optionExists) {
                    serviceSelect.value = serviceValue;
                }
            }
        }
    };

    // Close Modal Function
    window.closeModal = function() {
        if (orderModal) {
            orderModal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Enable scrolling
        }
    };

    // "Order Now" main button in Hero
    const heroOrderBtn = document.querySelector('.hero-btns .btn-primary');
    if (heroOrderBtn) {
        heroOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.openModal();
        });
    }

    // Specific Service Buttons
    const serviceBtns = document.querySelectorAll('.order-service-btn');
    serviceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceType = btn.getAttribute('data-service') || btn.dataset.service;
            window.openModal(serviceType);
        });
    });

    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Intelligent closing based on parent modal
            const modal = btn.closest('.modal-overlay') || btn.closest('.lightbox');
            if (modal) {
                if (modal.id === 'orderModal') closeModal();
                else if (modal.id === 'preview3d-modal') closePreview3d();
                else if (modal.id === 'shareModal') closeShareModal();
                else if (modal.classList.contains('lightbox')) modal.classList.remove('active');
            }
            
            // Handle chat preview
            if (btn.classList.contains('close-preview')) {
                removeChatImage();
            }
            
            // Handle chat separately if needed
            const chatWindow = document.getElementById('chatWindow');
            if (chatWindow && chatWindow.classList.contains('open') && !btn.closest('.chat-preview-area')) {
                toggleChatbot();
            }
        });
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            closeModal();
        }
    });

    // 7. File Upload Logic
    const fileInput = document.getElementById('modelFile');
    const fileUploadBox = document.getElementById('fileUploadBox');
    const fileInfo = document.getElementById('fileInfo');
    const fileNameDisplay = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFile');
    const estimatedPriceBox = document.getElementById('estimatedPriceBox');
    const fakePriceContainer = document.getElementById('fakePriceContainer');

    function handleFile(file) {
        if (file) {
            fileNameDisplay.textContent = file.name;
            fileUploadBox.style.display = 'none';
            fileInfo.style.display = 'flex';
            
            // Artificial delay to show "Estimated Price"
            setTimeout(() => {
                // Estimate price based on $85/kg (PLA density ~1.24 g/cm³)
                const randomWeight = (Math.random() * 0.45 + 0.05).toFixed(2); // 50g - 500g
                const estimatedPrice = (randomWeight * 85).toFixed(2);
                fakePriceContainer.textContent = `يبدأ من $${estimatedPrice} (${(randomWeight * 1000).toFixed(0)}g)`;
                estimatedPriceBox.style.display = 'block';
            }, 800);
        }
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });
    }

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            fileInput.value = '';
            fileInfo.style.display = 'none';
            fileUploadBox.style.display = 'block';
            estimatedPriceBox.style.display = 'none';
        });
    }

    // Drag and drop styles
    if (fileUploadBox) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUploadBox.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            fileUploadBox.addEventListener(eventName, () => {
                fileUploadBox.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileUploadBox.addEventListener(eventName, () => {
                fileUploadBox.classList.remove('dragover');
            }, false);
        });

        fileUploadBox.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            if(files.length > 0) {
                fileInput.files = files; // Assign files to input
                handleFile(files[0]);
            }
        });
    }

    // Handle Modal Form Submission
    const modalOrderForm = document.getElementById('modalOrderForm');
    if (modalOrderForm) {
        modalOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = modalOrderForm.querySelector('button[type="submit"]');
            const ogText = submitBtn.innerHTML;
            
            const service = document.getElementById('serviceSelect').value;
            const phone = "967737214666"; // Main MNLAB Phone
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري معالجة طلبك...';
            submitBtn.disabled = true;

            try {
                // Submit to backend using FormData for file support
                const formData = new FormData();
                const fileInput = document.getElementById('modelFile');
                
                if (fileInput && fileInput.files[0]) {
                    formData.append('file', fileInput.files[0]);
                }
                
                formData.append('customer_name', "عميل من الموقع");
                formData.append('service_type', service);
                formData.append('details', `خدمة: ${service}`);

                const resp = await fetch(`${API_BASE}/api/v1/orders`, {
                    method: 'POST',
                    body: formData // No Content-Type header needed for FormData
                });
                
                const data = await resp.json();
                
                if (resp.ok) {
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> تم الحجز! نقلك للواتساب...';
                    submitBtn.style.background = '#25D366';

                    // Redirect to WhatsApp with order ID
                    const whatsappMsg = encodeURIComponent(`مرحباً MNLAB، أود متابعة طلبي رقم: ${data.order_id}\nالخدمة: ${service}`);
                    const whatsappUrl = `https://wa.me/${phone}?text=${whatsappMsg}`;
                    
                    setTimeout(() => {
                        window.open(whatsappUrl, '_blank');
                        closeModal();
                        modalOrderForm.reset();
                        if (removeFileBtn) removeFileBtn.click();
                        submitBtn.innerHTML = ogText;
                        submitBtn.style.background = '';
                        submitBtn.disabled = false;
                    }, 2000);
                } else {
                    throw new Error("Backend Error");
                }
            } catch (err) {
                console.error(err);
                submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> فشل الطلب (تأكد من عمل السيرفر)';
                submitBtn.style.background = '#ff4d4d';
                setTimeout(() => {
                    submitBtn.innerHTML = ogText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 4000);
            }
        });
    }

    // 8. FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            
            // Close all other items (optional, but good UX)
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('open');
                otherItem.querySelector('.faq-answer').style.maxHeight = null;
            });
            
            if (!isOpen) {
                item.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
    
    // 9. QR Share Logic
    const shareModal = document.getElementById('shareModal');
    window.openShareModal = function(e) {
        if(e) e.preventDefault();
        if(shareModal) {
            shareModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    window.closeShareModal = function() {
        if(shareModal) {
            shareModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    window.nativeShare = function() {
        const shareData = {
            title: 'MNLAB 3D Printing',
            text: 'خدمات الطباعة ثلاثية الأبعاد وتطوير المنتجات',
            url: 'https://mnlab3d.com' // Placeholder until real domain
        };

        if (navigator.share) {
            navigator.share(shareData).catch((err) => console.log('خطأ في المشاركة:', err));
        } else {
            // Fallback for browsers that do not support Web Share API
            navigator.clipboard.writeText(shareData.url).then(() => {
                alert('تم نسخ الرابط! يمكنك الآن لصقه ومشاركته.');
            }).catch(err => {
                console.error('خطأ في نسخ النص: ', err);
            });
        }
    };

    // 10. AI Chatbot Logic
    const chatWindow = document.getElementById('chatWindow');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatBadge = document.querySelector('.chat-badge');

    // Chatbot state
    let isChatOpen = false;

    window.toggleChatbot = function() {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWindow.classList.add('open');
            if (chatBadge) chatBadge.style.display = 'none';
            chatInput.focus();
            // Show quick actions on first open if only welcome message exists
            if (chatMessages.querySelectorAll('.chat-message').length <= 1) {
                showQuickActions();
            }
        } else {
            chatWindow.classList.remove('open');
        }
    };

    function showQuickActions() {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chat-quick-actions';
        const actions = [
            { text: '📦 خدمات الطباعة', query: 'ما هي خدمات الطباعة؟' },
            { text: '💰 الأسعار', query: 'كم الأسعار؟' },
            { text: '🧪 المواد المتاحة', query: 'ما هي المواد المتاحة؟' },
            { text: '📞 التواصل', query: 'كيف أتواصل معكم؟' },
        ];
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'quick-action-btn';
            btn.textContent = action.text;
            btn.addEventListener('click', () => {
                actionsDiv.remove();
                addUserMessage(action.query);
                generateAIResponse(action.query);
            });
            actionsDiv.appendChild(btn);
        });
        chatMessages.appendChild(actionsDiv);
        scrollChatToBottom();
    }

    function addUserMessage(text, imgSrc = null) {
        const msg = document.createElement('div');
        msg.className = 'chat-message user-message';
        let innerHTML = '';
        if (imgSrc) {
            innerHTML += `<img src="${imgSrc}" alt="user upload" style="max-height: 150px; border-radius: 8px; margin-bottom: 5px;">`;
        }
        if (text) {
            innerHTML += `<p>${escapeHTML(text)}</p>`;
        }
        msg.innerHTML = innerHTML;
        chatMessages.appendChild(msg);
        scrollChatToBottom();
    }

    function addAIMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'chat-message ai-message';
        msg.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(msg);
        scrollChatToBottom();
    }

    function showTypingIndicator() {
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.id = 'typingIndicator';
        typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatMessages.appendChild(typing);
        scrollChatToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    function scrollChatToBottom() {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // AI Integration (Google Gemini API)
    dynamicGeminiKey = 'AIzaSyDHAQL7kdN6lNBcBok1eNB8dG7wwo6E6io'; // Default fallback
    
    // Maintain conversation history
    let conversationHistory = [];

    let selectedImageData = null;
    let speechRecognition = null;
    let isRecording = false;

    window.handleImageSelection = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64String = e.target.result.split(',')[1];
            selectedImageData = {
                mimeType: file.type,
                data: base64String,
                srcUrl: e.target.result
            };
            document.getElementById('chatPreviewArea').style.display = 'flex';
            document.getElementById('chatPreviewImage').src = selectedImageData.srcUrl;
        };
        reader.readAsDataURL(file);
    };

    window.removeChatImage = function() {
        selectedImageData = null;
        document.getElementById('chatPreviewArea').style.display = 'none';
        document.getElementById('chatImageInput').value = '';
    };

    window.toggleVoiceRecord = function() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('عذراً، متصفحك لا يدعم ميزة المايكروفون.');
            return;
        }
        if (isRecording) {
            if (speechRecognition) speechRecognition.stop();
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        speechRecognition.lang = 'ar-SA';
        speechRecognition.interimResults = false;
        
        speechRecognition.onstart = () => {
            isRecording = true;
            document.getElementById('micBtn').classList.add('recording');
        };
        speechRecognition.onresult = (event) => {
            document.getElementById('chatInput').value += event.results[0][0].transcript + " ";
        };
        speechRecognition.onend = () => {
            isRecording = false;
            document.getElementById('micBtn').classList.remove('recording');
        };
        speechRecognition.start();
    };

    async function generateAIResponse(userText, imageData = null) {
        showTypingIndicator();

        const systemPrompt = "أنت 'مساعد MNLAB الذكي'، خبير في تقنيات الطباعة ثلاثية الأبعاد والتصنيع الرقمي، ولست مساعداً عاماً (مثل ChatGPT).\n\nحول MNLAB:\n1. الرائدون في اليمن في دمج الذكاء الاصطناعي مع التصنيع الرقمي.\n2. نطور خدمات ومنتجات رائدة في مجال التصنيع ثلاثي الأبعاد.\n\nإرشادات الرد:\n- تحدث باللغة العربية بأسلوب ودود ومحترف.\n- أجب بذكاء واحترافية فقط عن الأسئلة المتعلقة بالطباعة ثلاثية الأبعاد، التصنيع الرقمي، والخامات هندسة الميكانيكا، وخدمات موقع MNLAB.\n- إذا سألك المستخدم سؤالاً عاماً خارج نطاق المشروع (مثل كتابة برمجة، نكات، أو معلومات عامة لا تخص 3D)، يجب عليك أن تعتذر بذكاء ولطف شديد، وتوضح له أنك 'بوت مخصص فقط للإجابة وتقديم المساعدة في كل ما يخص الطباعة ثلاثية الأبعاد ومشروع MNLAB' ولا يمكنك تلبية طلبه بصفتك ممثلاً لشركة MNLAB.\n- رقم التواصل المباشر مع الدعم الفني: 967737214666.";

        let newParts = [];
        if (userText) newParts.push({ text: userText });
        else if (imageData) newParts.push({ text: "ماذا ترى في هذه الصورة فيما يتعلق بالطباعة ثلاثية الأبعاد؟" });

        if (imageData) {
            newParts.push({
                inlineData: {
                    data: imageData.data,
                    mimeType: imageData.mimeType
                }
            });
        }

        // Add to history
        conversationHistory.push({
            role: "user",
            parts: newParts
        });

        try {
            const activeKey = dynamicGeminiKey || 'AIzaSyDHAQL7kdN6lNBcBok1eNB8dG7wwo6E6io';

            if (!activeKey || activeKey.includes('ضع_مفتاح')) {
                throw new Error("API_KEY_MISSING");
            }

            // Ensure role alternation for Gemini API
            let safeHistory = [];
            let lastRole = null;
            for (const msg of conversationHistory) {
                if (msg.role !== lastRole) {
                    safeHistory.push(msg);
                    lastRole = msg.role;
                }
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: safeHistory,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Gemini Error:", err);
                throw new Error(err.error?.message || "SERVER_ERROR");
            }

            const data = await response.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (aiText) {
                conversationHistory.push({ role: "model", parts: [{ text: aiText }] });
                let formattedText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                removeTypingIndicator();
                addAIMessage(formattedText);
            } else {
                throw new Error("EMPTY_RESPONSE");
            }
        } catch (error) {
            removeTypingIndicator();
            console.error('Chatbot Error:', error);
            // Rollback last user message if it failed to avoid breaking alternation next time
            if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length-1].role === 'user') {
                conversationHistory.pop();
            }
            
            let userFriendlyMsg = "حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة بعد قليل.";
            if (error.message === "API_KEY_MISSING") {
                userFriendlyMsg = "عذراً، مفتاح API الخاص بـ Gemini غير متوفر أو غير صالح.";
            } else if (error.message.includes("API key not valid")) {
                userFriendlyMsg = "مفتاح الـ API غير صالح. يرجى التحقق من لوحة التحكم.";
            } else if (error.message.includes("exceeded") || error.message.includes("quota") || error.message.includes("429")) {
                userFriendlyMsg = "يبدو أن هناك ضغطاً حالياً على الخادم (كثرة الطلبات)، يرجى الانتظار دقيقة والمحاولة ثانية.";
            } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
                userFriendlyMsg = "مشكلة في الاتصال بالإنترنت، يرجى التأكد من شبكتك والمحاولة مجدداً.";
            }
            
            addAIMessage(userFriendlyMsg + " <br><small>(الخطأ التقني: " + error.message + ")</small>");
        }
    }

    window.sendChatMessage = function() {
        const text = chatInput.value.trim();
        const hasImage = selectedImageData !== null;
        
        if (!text && !hasImage) return;

        // Render in UI
        const imgSrc = hasImage ? selectedImageData.srcUrl : null;
        addUserMessage(text, imgSrc);
        
        // Cache the image data to send
        const imageDataToSend = hasImage ? { ...selectedImageData } : null;

        // Reset inputs
        chatInput.value = '';
        removeChatImage();

        generateAIResponse(text, imageDataToSend);
    };

    window.handleChatKeyPress = function(event) {
        if (event.key === 'Enter') {
            sendChatMessage();
        }
    };
    // 11. Statistics Counter 
    const counters = document.querySelectorAll('.counter');
    const statsSection = document.querySelector('.statistics');
    let countersStarted = false;
    
    if (statsSection) {
        window.addEventListener('scroll', () => {
            if (window.scrollY >= (statsSection.offsetTop - window.innerHeight + 100)) {
                if (!countersStarted) {
                    counters.forEach(counter => {
                        const target = +counter.getAttribute('data-target');
                        const speed = 100;
                        const updateCount = () => {
                            const count = +counter.innerText;
                            const inc = target / speed;
                            if (count < target) {
                                counter.innerText = Math.ceil(count + inc);
                                setTimeout(updateCount, 15);
                            } else {
                                counter.innerText = target + (target > 50 ? '+' : '');
                            }
                        };
                        updateCount();
                    });
                }
                countersStarted = true;
            }
        });
    }

    // 12. Gallery Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.querySelector('.close-lightbox');

    window.bindLightbox = function() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (galleryItems.length > 0 && lightbox) {
            galleryItems.forEach(item => {
                item.addEventListener('click', () => {
                    const img = item.querySelector('img').src;
                    lightboxImg.src = img;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden'; 
                });
            });
        }
    };

    if (closeLightbox) {
        closeLightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                lightbox.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    bindLightbox();

    // Keyboard code removed

    // 14. Dynamic Settings from Backend
    const API_BASE = '';

    async function initDynamicSettings() {
        try {
            const response = await fetch(`${API_BASE}/api/v1/settings`);
            if (!response.ok) return;
            const settings = await response.json();

            // Apply Colors
            if (settings.colors) {
                for (const [key, value] of Object.entries(settings.colors)) {
                    document.documentElement.style.setProperty(key, value);
                }
            }

            // Apply Content
            if (settings.content) {
                const heroTitle = document.querySelector('.hero-text h1');
                if (heroTitle && settings.content.hero_title) heroTitle.textContent = settings.content.hero_title;

                const heroSubtitle = document.querySelector('.hero-text p');
                if (heroSubtitle && settings.content.hero_subtitle) heroSubtitle.textContent = settings.content.hero_subtitle;

                const footerPhone = document.querySelector('.contact-item i.fa-whatsapp + span') || document.querySelector('.contact-item span');
                if (footerPhone && settings.content.contact_phone) footerPhone.textContent = settings.content.contact_phone;

                const footerEmail = document.querySelector('.contact-item i.fa-envelope + span');
                if (footerEmail) footerEmail.textContent = settings.content.contact_email;

                if (settings.content.gemini_api_key) {
                    dynamicGeminiKey = settings.content.gemini_api_key;
                    console.log("MNLAB AI: Using custom API key from settings.");
                }
            }

            // Apply Materials to Main UI
            if (settings.materials && Array.isArray(settings.materials) && settings.materials.length > 0) {
                const materialsGrid = document.getElementById('materials-grid');
                if (materialsGrid) {
                    materialsGrid.innerHTML = '';
                    settings.materials.forEach((mat, index) => {
                        const card = document.createElement('div');
                        card.className = `service-card reveal ${index > 0 ? 'delay-' + (index % 3) : ''}`;
                        card.innerHTML = `
                            <div class="icon-wrapper">
                                <i class="${getMaterialIcon(mat.name)}"></i>
                            </div>
                            <h3>${escapeHTML(mat.name)}</h3>
                            <p>${escapeHTML(mat.description)}</p>
                        `;
                        materialsGrid.appendChild(card);
                    });
                    
                    // Observe new elements for scroll animation
                    const newReveals = materialsGrid.querySelectorAll('.reveal');
                    if (typeof revealOnScroll !== 'undefined' && revealOnScroll.observe) {
                        newReveals.forEach(el => revealOnScroll.observe(el));
                    } else {
                        newReveals.forEach(el => el.classList.add('active'));
                    }
                }
            }

            // Apply Images
            if (settings.images && settings.images.hero_image) {
                const heroImg = document.querySelector('.hero-image img');
                if (heroImg) heroImg.src = settings.images.hero_image;
            }

            // Apply Gallery
            if (settings.images && settings.images.gallery && Array.isArray(settings.images.gallery) && settings.images.gallery.length > 0) {
                const galleryGrid = document.getElementById('dynamic-gallery-grid');
                if (galleryGrid) {
                    galleryGrid.innerHTML = settings.images.gallery.map(img => {
                         const src = img.startsWith('data:') ? img : (img.startsWith('gallery') ? `/${img}` : img);
                         return `
                            <div class="gallery-item reveal">
                                <img src="${src}" alt="3D Printed Part" class="gallery-img">
                                <div class="gallery-placeholder">
                                    <i class="fas fa-cube"></i>
                                    <span>عمل من المختبر</span>
                                </div>
                            </div>
                         `;
                    }).join('');
                    
                    // Re-bind Lightbox & Reveal
                    if (window.bindLightbox) window.bindLightbox();
                    const newReveals = galleryGrid.querySelectorAll('.reveal');
                    if (typeof revealOnScroll !== 'undefined' && revealOnScroll.observe) {
                        newReveals.forEach(el => revealOnScroll.observe(el));
                    } else {
                        newReveals.forEach(el => el.classList.add('active'));
                    }
                }
            }

            // Apply Statistics
            if (settings.statistics) {
                const statsMap = {
                    'stat-projects': settings.statistics.projects,
                    'stat-clients': settings.statistics.clients,
                    'stat-materials': settings.statistics.materials,
                    'stat-speed': settings.statistics.speed
                };
                for (const [id, value] of Object.entries(statsMap)) {
                    const el = document.getElementById(id);
                    if (el) {
                        el.setAttribute('data-target', value);
                        // If animation already finished, update text too
                        if (countersStarted) el.innerText = value + (value > 50 ? '+' : '');
                    }
                }
            }

        } catch (err) {
            console.warn('Backend not available for dynamic settings, using defaults.', err);
        }
    }

    function getMaterialIcon(name) {
        if (!name) return 'fas fa-cube';
        const n = name.toLowerCase();
        if (n.includes('pla')) return 'fab fa-envira';
        if (n.includes('abs')) return 'fas fa-shield-alt';
        if (n.includes('petg')) return 'fas fa-vial';
        if (n.includes('resin')) return 'fas fa-tint';
        return 'fas fa-cube';
    }

    // Admin management removed from public script for security


    // 16. AI Lab Features (Vision System & X-Algorithm)
    window.runAiVision = async function(input) {
        const file = input.files[0];
        if (!file) return;

        const resDiv = document.getElementById('ai-vision-result');
        resDiv.style.display = 'block';
        resDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تحليل الصورة عبر YOLOv9 و EfficientNet...';

        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await fetch(`${API_BASE}/api/v1/analyze_scene`, {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            
            if (resp.ok && data.status === "success") {
                const results = data.data;
                let html = `<p style="color: var(--accent-1); font-weight: bold; margin-bottom: 5px;">تم التحليل بنجاح:</p>`;
                html += `<div style="margin-bottom: 5px;"><strong>تحليل المشهد:</strong> ${results.scene_understanding}</div>`;
                html += `<div style="margin-bottom: 5px;"><strong>الكائنات المكتشفة:</strong> ${results.objects_detected.length > 0 ? results.objects_detected[0].class : 'لا يوجد'}</div>`;
                html += `<div style="margin-bottom: 5px;"><strong>الخصوصية:</strong> ${results.audit_trail.privacy_level}</div>`;
                resDiv.innerHTML = html;
            } else {
                resDiv.innerHTML = '<span style="color:red;">فشل التحليل. تأكد من عمل السيرفر.</span>';
            }
        } catch (err) {
            console.error(err);
            resDiv.innerHTML = '<span style="color:red;">خطأ بالاتصال بالخادم الذكي.</span>';
        }
    };

    window.runXAlgorithm = async function() {
        const resDiv = document.getElementById('ai-algo-result');
        const list = document.getElementById('algo-list');
        resDiv.style.display = 'block';
        list.innerHTML = '<li><i class="fas fa-spinner fa-spin"></i> جاري استدعاء خوارزمية X...</li>';

        try {
            // Using a mock user id
            const resp = await fetch(`${API_BASE}/api/v1/recommend_models?user_id=guest_2026`);
            const data = await resp.json();
            
            if (resp.ok && data.status === "success") {
                const feed = data.data.feed; // Returns dict like {"Network Post 1...": 0.95}
                list.innerHTML = `<li style="color: var(--accent-3); font-size:0.8rem; margin-bottom:10px;">${data.data.algorithm_used}</li>`;
                for (const [item, score] of Object.entries(feed)) {
                    list.innerHTML += `<li style="margin-bottom: 5px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 5px;">
                        <i class="fas fa-cube" style="color:var(--accent-1); margin-left: 5px;"></i> 
                        ${item} 
                        <span style="color: #38ef7d; float: left; font-size:0.8rem;">ثقة: ${(score*100).toFixed(0)}%</span>
                    </li>`;
                }
            } else {
                list.innerHTML = '<li><span style="color:red;">فشل المعالجة من المحرك.</span></li>';
            }
        } catch (err) {
            console.error(err);
            list.innerHTML = '<li><span style="color:red;">خطأ بالاتصال بمحرك التوصيات.</span></li>';
        }
    };

    // --- 3D Viewer & Pricing Logic ---
    let threeRenderer, threeScene, threeCamera, threeControls;

    async function init3DPreview() {
        if (threeRenderer) return;
        const container = document.getElementById('threejs-container');
        threeScene = new THREE.Scene();
        threeScene.background = new THREE.Color(0x0a0a0f);
        
        threeCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        threeCamera.position.set(50, 50, 50);
        
        threeRenderer = new THREE.WebGLRenderer({ antialias: true });
        threeRenderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(threeRenderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        threeScene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        threeScene.add(dirLight);

        threeControls = new OrbitControls(threeCamera, threeRenderer.domElement);
        threeControls.enableDamping = true;

        function animate() {
            requestAnimationFrame(animate);
            threeControls.update();
            threeRenderer.render(threeScene, threeCamera);
        }
        animate();
    }

    window.closePreview3d = function() {
        document.getElementById('preview3d-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    window.showPreview3d = async function(file) {
        document.getElementById('preview3d-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        await init3DPreview();

        // Clear previous meshes (skip lights)
        for (let i = threeScene.children.length - 1; i >= 0; i--) {
            const obj = threeScene.children[i];
            if (obj.type === 'Mesh') threeScene.remove(obj);
        }

        const loader = new STLLoader();
        const reader = new FileReader();
        reader.onload = function(e) {
            const geometry = loader.parse(e.target.result);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0x00f2fe, 
                specular: 0x111111, 
                shininess: 200,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            geometry.boundingBox.getCenter(center);
            mesh.position.sub(center);
            
            threeScene.add(mesh);
            
            // Adjust camera
            const size = new THREE.Vector3();
            geometry.boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            threeCamera.position.set(maxDim * 1.5, maxDim * 1.5, maxDim * 1.5);
            threeControls.target.set(0, 0, 0);

            // Calculate Volume, Weight & Price ($85/kg, PLA density ~1.24 g/cm³)
            const vol = (size.x * size.y * size.z) / 1000; // rough cm3
            const weightKg = (vol * 1.24) / 1000; // convert cm³ to grams then to kg
            const price = Math.max(5, weightKg * 85).toFixed(2); // $85/kg, min $5

            document.getElementById('preview-volume').innerText = `الحجم التقريبي: ${vol.toFixed(2)} سم³ | الوزن: ${(weightKg * 1000).toFixed(0)}g`;
            document.getElementById('preview-price').innerText = `السعر التقديري: $${price} ($85/kg)`;
        };
        reader.readAsArrayBuffer(file);
    };

    // --- Order Tracking Logic ---
    window.trackOrder = async function() {
        const orderId = document.getElementById('track-id-input').value.trim();
        const resultDiv = document.getElementById('tracking-result');
        if (!orderId) return;

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<p class="reveal">جاري البحث عن الطلب...</p>';

        try {
            const resp = await fetch(`${API_BASE}/api/v1/orders/${orderId}`);
            if (!resp.ok) throw new Error("ID_NOT_FOUND");
            const data = await resp.json();
            
            resultDiv.innerHTML = `
                <div class="reveal" style="border-right: 4px solid var(--accent-1); padding-right: 15px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px;">
                    <h4 class="gradient-text">${data.status}</h4>
                    <p style="font-size: 0.9rem; color: #ccc;">تاريخ الطلب: ${new Date(data.timestamp).toLocaleDateString('ar-YE')}</p>
                    <div class="progress" style="height: 10px; background: rgba(255,255,255,0.1); margin-top: 15px; border-radius: 5px; overflow: hidden;">
                        <div class="progress-bar" style="width: ${data.status === 'قيد المراجعة' ? '30%' : data.status === 'قيد الطباعة' ? '70%' : '100%'}; background: var(--accent-1); height: 100%; transition: width 1s ease;"></div>
                    </div>
                </div>
            `;
        } catch (err) {
            resultDiv.innerHTML = '<p style="color: #ff4d4d;" class="reveal">عذراً، لم يتم العثور على هذا الرقم. يرجى التحقق منه.</p>';
        }
    };

    // --- Price Form Simulation ---
    window.showOrderForm = function() {
        const price = document.getElementById('preview-price').innerText;
        alert(`تم اختيار الموديل! نقلك الآن لتأكيد الطلب بسعر: ${price}\n(سيتم ربط هذا بنموذج واتساب احترافي في الخطوة القادمة)`);
    };

    // --- Intercept Uploads ---
    const aiUpload = document.getElementById('ai-vision-upload');
    if (aiUpload) {
        aiUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.name.toLowerCase().endsWith('.stl')) {
                showPreview3d(file);
            }
        });
    }

    // --- Start Platform Logic (After all definitions) ---
    initDynamicSettings();

    // --- Dynamic QR Code Generation ---
    // Generates real QR codes pointing to the public URL OR local IP
    async function initDynamicQR() {
        let siteUrl = window.location.origin;
        const hostname = window.location.hostname;
        
        // If we are on localhost or a local IP, try to fetch the server's network IP
        // But if we are already on a public tunnel (like trycloudflare.com), keep that URL!
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            try {
                const resp = await fetch('/api/v1/local-ip');
                if (resp.ok) {
                    const data = await resp.json();
                    siteUrl = data.url; 
                }
            } catch (e) {
                console.warn('Could not fetch local IP for QR, using current origin.');
            }
        }

        const heroQR = document.getElementById('hero-qr-img');
        const shareQR = document.getElementById('share-qr-img');
        
        const qrApiBase = 'https://api.qrserver.com/v1/create-qr-code/';
        
        if (heroQR) {
            heroQR.src = `${qrApiBase}?size=150x150&data=${encodeURIComponent(siteUrl)}&color=00f2fe&bgcolor=ffffff`;
        }
        if (shareQR) {
            shareQR.src = `${qrApiBase}?size=250x250&data=${encodeURIComponent(siteUrl)}&color=00f2fe&bgcolor=ffffff`;
        }
    }
    initDynamicQR();

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        });
    }

});
