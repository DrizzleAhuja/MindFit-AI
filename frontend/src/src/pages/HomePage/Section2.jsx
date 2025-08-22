// Section2.js - Updated with professional styling
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Activity, Target, Users, Check, Heart, Dumbbell, ArrowRight } from "lucide-react";

const Section2 = () => {
  const features = [
    {
      icon: <Activity className="w-6 h-6 text-green-500" />,
      title: "Holistic Wellness",
      description: "Balance mind and body with guided habits for resilience and vitality."
    },
    {
      icon: <Target className="w-6 h-6 text-blue-500" />,
      title: "Personalized Coaching",
      description: "Adaptive plans for workouts, recovery, and mindfulness—tailored to you."
    },
    {
      icon: <Users className="w-6 h-6 text-purple-500" />,
      title: "Supportive Community",
      description: "Stay motivated with programs designed for sustainable progress."
    }
  ];

  return (
    <section className="py-20 bg-white text-gray-900">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-600">
            MindFit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Where mental wellness meets fitness. Train your body, strengthen your mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-xl shadow-lg transition-all hover:shadow-xl bg-gray-50"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-white">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-50 to-blue-50">
          <div className="grid md:grid-cols-2">
            <div className="p-10 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-4">Start your MindFit journey</h2>
              <p className="text-lg mb-8 text-gray-600">
                Build routines that improve focus, mood, and physical performance—together.
              </p>
              <Link 
                to="/signup" 
                className="flex items-center justify-center w-full md:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 text-white font-medium hover:opacity-90 transition-all"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center p-8 bg-white">
              <div className="relative w-full h-64">
                <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-xl opacity-20 bg-green-500"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-xl opacity-20 bg-blue-500"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  <div className="p-6 rounded-2xl shadow-lg bg-white">
                    <div className="flex items-center mb-4">
                      <Dumbbell className="text-green-500 mr-3" />
                      <span className="font-semibold">Today's MindFit Plan</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Breathing Practice</span>
                        <span className="font-medium">5 min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Strength Circuit</span>
                        <span className="font-medium">3 rounds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gratitude Note</span>
                        <span className="font-medium">2 min</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center">
                        <Heart className="text-red-500 mr-2" />
                        <span className="text-sm">Rest & Recovery</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">Balanced</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Section2;