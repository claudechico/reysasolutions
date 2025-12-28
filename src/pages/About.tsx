import { useState, useEffect } from 'react';
import { Award, Users, TrendingUp, Shield, Target } from 'lucide-react';
import { usersApi, propertiesApi, PropertyDto } from '../lib/api';

export default function About() {
  const [stats, setStats] = useState({
    yearsExperience: '15+',
    propertiesListed: 0,
    expertAgents: 0,
    happyClients: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch total properties count from backend (only approved properties)
      let propertiesCount = 0;
      try {
        const propsRes = await propertiesApi.list({ page: 1, limit: 1000 }).catch(() => null);
        if (propsRes?.properties) {
          // Count only approved properties
          const approvedCount = propsRes.properties.filter((property: PropertyDto & { moderationStatus?: string }) => {
            const moderationStatus = property?.moderationStatus;
            return moderationStatus && String(moderationStatus).toLowerCase() === 'approved';
          }).length;
          propertiesCount = approvedCount;
        } else if (propsRes?.total) {
          propertiesCount = Number(propsRes.total);
        }
      } catch (e) {
        console.error('Failed to load property count', e);
      }

      // Count users (clients) from backend table using public count endpoint (no auth required)
      let clientsCount = 0;
      try {
        const clientsRes = await usersApi.count({ role: 'users' }).catch((e) => {
          console.warn('Failed to load clients count:', e);
          return null;
        });
        // Backend returns 'count' not 'total'
        if (clientsRes?.count !== undefined) {
          clientsCount = Number(clientsRes.count);
        }
      } catch (e) {
        console.error('Failed to load clients count', e);
        clientsCount = 0;
      }

      // Count agents (owners + agents) from backend tables using public count endpoint (no auth required)
      let agentsCount = 0;
      try {
        // Count owners
        const ownersRes = await usersApi.count({ role: 'owner' }).catch((e) => {
          console.warn('Failed to load owners count:', e);
          return null;
        });
        const ownersCount = ownersRes?.count !== undefined ? Number(ownersRes.count) : 0;

        // Count agents
        const agentsRes = await usersApi.count({ role: 'agent' }).catch((e) => {
          console.warn('Failed to load agents count:', e);
          return null;
        });
        const agentsRoleCount = agentsRes?.count !== undefined ? Number(agentsRes.count) : 0;

        agentsCount = ownersCount + agentsRoleCount;
      } catch (e) {
        console.error('Failed to load agents count', e);
        agentsCount = 0;
      }

      // Update stats with real counts from backend
      setStats({
        yearsExperience: '15+',
        propertiesListed: propertiesCount,
        expertAgents: agentsCount,
        happyClients: clientsCount
      });
    } catch (err) {
      console.error('Failed to load statistics', err);
    }
  };

  const statsDisplay = [
    { value: stats.yearsExperience, label: 'Years Experience' },
    { value: stats.propertiesListed > 0 ? stats.propertiesListed.toLocaleString() : '0', label: 'Properties Listed' },
    { value: stats.expertAgents > 0 ? stats.expertAgents.toLocaleString() : '0', label: 'Expert Agents' },
    { value: stats.happyClients > 0 ? stats.happyClients.toLocaleString() : '0', label: 'Happy Clients' }
  ];

  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Trust & Transparency',
      description: 'We believe in honest dealings and complete transparency throughout the entire real estate process.'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Client-Focused',
      description: 'Your needs and satisfaction are our top priority. We tailor our services to match your unique requirements.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Excellence',
      description: 'We strive for excellence in every interaction, delivering premium quality service that exceeds expectations.'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Innovation',
      description: 'We leverage the latest technology and market insights to give you a competitive advantage.'
    }
  ];
// 
  // const team = [
  //   {
  //     name: 'Sarah Johnson',
  //     role: 'CEO & Founder',
  //     image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
  //   },
  //   {
  //     name: 'Michael Chen',
  //     role: 'Head of Sales',
  //     image: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=400'
  //   },
  //   {
  //     name: 'Emily Rodriguez',
  //     role: 'Lead Agent',
  //     image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400'
  //   },
  //   {
  //     name: 'David Thompson',
  //     role: 'Property Manager',
  //     image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400'
  //   }
  // ];

  return (
  <div className="min-h-screen pt-24 bg-white">
      <div className="bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              About <span className="bg-gradient-to-r from-light-blue-500 to-dark-blue-700 bg-clip-text text-transparent">Reysasolutions</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              We are a leading real estate company dedicated to helping you find your dream home. Founded in 2023, we've rapidly grown into a trusted name known for professionalism, integrity, and results.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {statsDisplay.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-lg border border-gray-100">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-light-blue-500 to-dark-blue-700 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Our Story</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Founded in 2023, Reysasolutions was established with a clear mission: to redefine the real estate industry by putting clients first. What began as a focused local initiative has rapidly grown into a trusted name, known for professionalism, integrity, and results.
              </p>
              <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                Our team is made up of dedicated and skilled professionals who bring strong expertise in both residential and commercial real estate. We understand that buying or selling property is one of life's most important decisions, and we are committed to providing reliable guidance, transparency, and support at every stage of the process.
              </p>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Today, we proudly serve clients with a comprehensive range of real estate services, including property search, valuation, negotiation, and closing. Our commitment to excellence and client satisfaction continues to build lasting relationships and earn the trust of our valued clients.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Our Office"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Our Values</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                  <div className="bg-gradient-to-br from-light-blue-500 to-dark-blue-500 text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-light-blue-500/30">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="bg-gradient-to-r from-light-blue-500 to-dark-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">Join Our Growing Community</h2>
          <p className="text-base sm:text-lg md:text-xl text-light-blue-100 mb-6 sm:mb-8 px-2">
            Whether you're buying, selling, or investing, we're here to help you achieve your real estate goals.
          </p>
          <button className="bg-white text-dark-blue-500 px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-light-blue-50 transition font-medium shadow-xl text-sm sm:text-base">
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  );
}
