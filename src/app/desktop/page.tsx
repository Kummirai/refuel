// src/app/desktop/page.tsx (optional desktop version)
"use client";

import { useState } from "react";
import ServiceCard from "@/components/services/ServiceCard";
import PopularBrands from "@/components/ui/PopularBrands";

export default function DesktopHomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="min-h-screen bg-light">
      {/* Top Navigation */}
      <nav className="bg-primary shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-highlight rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-2xl">D</span>
              </div>
              <h1 className="text-white font-bold text-2xl">
                Drive<span className="text-highlight">Hub</span>
              </h1>
            </div>

            <div className="flex gap-6">
              <a
                href="#"
                className="text-white hover:text-highlight transition"
              >
                Home
              </a>
              <a
                href="#"
                className="text-white hover:text-highlight transition"
              >
                Services
              </a>
              <a
                href="#"
                className="text-white hover:text-highlight transition"
              >
                Vehicles
              </a>
              <a
                href="#"
                className="text-white hover:text-highlight transition"
              >
                Contact
              </a>
            </div>

            <button className="bg-highlight text-primary px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-4">
                Your One-Stop Driver Service Platform
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Fuel, Airtime, Cash, Car Wash - All at your fingertips
              </p>
              <button className="bg-highlight text-primary px-8 py-3 rounded-lg font-semibold text-lg hover:shadow-lg transition">
                Get Started
              </button>
            </div>
            <div className="relative">
              <img
                src="/images/hero-car.png"
                alt="Hero Car"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services Section - Desktop Grid */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-primary text-center mb-12">
          Our Services
        </h2>
        <div className="grid grid-cols-4 gap-6">
          <ServiceCard
            title="Fuel"
            icon="⛽"
            color="from-green-500 to-green-600"
            onClick={() => {}}
          />
          <ServiceCard
            title="Airtime"
            icon="📱"
            color="from-blue-500 to-blue-600"
            onClick={() => {}}
          />
          <ServiceCard
            title="Cash"
            icon="💰"
            color="from-yellow-500 to-yellow-600"
            onClick={() => {}}
          />
          <ServiceCard
            title="Car Wash"
            icon="🧼"
            color="from-purple-500 to-purple-600"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Featured Vehicles - Desktop Layout */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">
            Featured Vehicles
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-light rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
              >
                <img
                  src={`/images/car-${item}.jpg`}
                  alt={`Car ${item}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-2">
                    Ford Mustang GT
                  </h3>
                  <p className="text-gray-600 mb-4">
                    5.0L V8 • 450hp • Automatic
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-secondary">
                      ₹74,00,000
                    </span>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Brands - Desktop */}
      <div className="container mx-auto px-6 py-16">
        <PopularBrands />
      </div>
    </div>
  );
}
