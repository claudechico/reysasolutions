import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 5000);
  };

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-xl shadow-blue-500/20">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 bg-clip-text">
            Get in Touch
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Phone</h3>
              <p className="text-gray-500 mb-4 text-sm">Mon - Fri: 8AM - 6PM</p>
              <p className="text-gray-500 mb-4 text-sm">Sat: 9AM - 4PM</p>
              <div className="space-y-2">
                <a href="tel:+255684304594" className="block text-blue-600 font-semibold hover:text-blue-700 transition-colors text-lg">
                  +255 684 304 594
                </a>
                <a href="tel:+255672232334" className="block text-blue-600 font-semibold hover:text-blue-700 transition-colors text-lg">
                  +255 672 232 334
                </a>
              </div>
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Email</h3>
              <p className="text-gray-500 mb-4 text-sm">We reply within 24 hours</p>
              <div className="space-y-2">
                <a href="mailto:info@reysasolutions.co.tz" className="block text-indigo-600 font-semibold hover:text-indigo-700 transition-colors text-sm break-all">
                  info@reysasolutions.co.tz
                </a>
                <a href="mailto:support@reysasolutions.co.tz" className="block text-indigo-600 font-semibold hover:text-indigo-700 transition-colors text-sm break-all">
                  support@reysasolutions.co.tz
                </a>
                <a href="mailto:sales@reysasolutions.co.tz" className="block text-indigo-600 font-semibold hover:text-indigo-700 transition-colors text-sm break-all">
                  sales@reysasolutions.co.tz
                </a>
              </div>
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Visit Our Office</h3>
              <p className="text-gray-500 mb-4 text-sm">Reysa Solutions Ltd</p>
              <p className="text-purple-600 font-semibold leading-relaxed">
                Mbezi Beach<br />
                Kinondoni, Dar es salaam<br />
                Tanzania
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 lg:p-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full"></div>
            
            <div className="relative">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
              <p className="text-gray-500 mb-8">Fill out the form below and we'll get back to you</p>

              {submitted && (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 font-semibold">Thank you for your message! We'll get back to you soon.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                      placeholder="+255672232334"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Select a subject</option>
                      <option value="buying">Buying a Property</option>
                      <option value="selling">Selling a Property</option>
                      <option value="inquiry">General Inquiry</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white/50 backdrop-blur-sm"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 font-semibold flex items-center justify-center space-x-3 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Office Hours */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Office Hours</h2>
                </div>
                <div className="space-y-5">
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl hover:bg-gray-100 transition-colors">
                    <Clock className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">Monday - Friday</p>
                      <p className="text-gray-600">8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl hover:bg-gray-100 transition-colors">
                    <Clock className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">Saturday</p>
                      <p className="text-gray-600">9:00 AM - 4:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl hover:bg-green-100 transition-colors">
                    <Clock className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">Support</p>
                      <p className="text-gray-600">Available 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Chat Card */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
              <div className="relative">
                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Live Chat</h3>
                <ul className="space-y-3 mb-8 text-blue-50">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Available 24/7</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Instant responses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Expert assistance</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Multi-language support</span>
                  </li>
                </ul>
                <button
                  onClick={() => window.open('YOUR_CHAT_URL', '_blank')}
                  className="w-full bg-white text-blue-700 px-6 py-4 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Chat Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 relative">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Us</h2>
            <p className="text-gray-600">Visit our office location</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="h-[500px] bg-gray-200 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.8340191291437!2d39.2758!3d-6.7723!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x185c4c1df6138671%3A0x7c9b5fee0380a64f!2sMbezi%20Beach%2C%20Dar%20es%20Salaam%2C%20Tanzania!5e0!3m2!1sen!2s!4v1635444444444!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Office Location"
                className="rounded-3xl"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
