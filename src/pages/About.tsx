import { Award, Users, TrendingUp, Shield, Target } from 'lucide-react';

export default function About() {
  const stats = [
    { value: '15+', label: 'Years Experience' },
    { value: '10K+', label: 'Properties Sold' },
    { value: '500+', label: 'Expert Agents' },
    { value: '5K+', label: 'Happy Clients' }
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

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Michael Chen',
      role: 'Head of Sales',
      image: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Lead Agent',
      image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'David Thompson',
      role: 'Property Manager',
      image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  return (
  <div className="min-h-screen pt-24 bg-white">
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Reysasolutions</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We are a leading real estate company dedicated to helping you find your dream home. With over 15 years of experience, we've helped thousands of families discover their perfect property.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-100">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Founded in 2008, Reysasolutions began with a simple mission: to revolutionize the real estate industry by putting clients first. What started as a small local agency has grown into one of the most trusted names in real estate.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Our team of experienced professionals brings together decades of combined expertise in residential and commercial real estate. We understand that buying or selling a property is one of life's most significant decisions, and we're here to guide you every step of the way.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, we're proud to serve clients across the nation, offering a comprehensive range of services from property search and valuation to negotiation and closing. Our commitment to excellence and client satisfaction has earned us numerous industry awards and, more importantly, the trust of thousands of happy homeowners.
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
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Dedicated professionals committed to your success
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all group">
                  <div className="relative overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-blue-600 font-medium">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Join Our Growing Community</h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you're buying, selling, or investing, we're here to help you achieve your real estate goals.
          </p>
          <button className="bg-white text-blue-700 px-8 py-4 rounded-lg hover:bg-blue-50 transition font-medium shadow-xl">
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  );
}
