import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-dark-blue-500 to-dark-blue-700 p-2 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Reysasolutions</span>
            </div>
            <p className="text-gray-400 mb-4">
              Your trusted partner in finding the perfect home. We connect you with premium properties and provide expert guidance throughout your real estate journey.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-dark-blue-500 p-2 rounded-lg hover:bg-dark-blue-600 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="bg-dark-blue-500 p-2 rounded-lg hover:bg-dark-blue-600 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="bg-dark-blue-500 p-2 rounded-lg hover:bg-dark-blue-600 transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-light-blue-400 transition">Home</Link></li>
              <li><Link to="/properties" className="hover:text-light-blue-400 transition">Properties</Link></li>
              <li><Link to="/about" className="hover:text-light-blue-400 transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-light-blue-400 transition">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-light-blue-400" />
                <span>+255672232334</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-light-blue-400" />
                <span> info@reysasolutions.co.tz</span>
              </li>
              <li className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-light-blue-400" />
                <span>Mbezi Beach Kinondoni Dar es salaam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2025 ReysaSolutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
