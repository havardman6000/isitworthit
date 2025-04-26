import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Share } from "lucide-react";
import { toast } from "sonner";
import MoneyRain from "@/components/MoneyRain";
import ConfettiExplosion from "@/components/ConfettiExplosion";
import { calculateWorthComparisons } from "@/lib/worth-calculator";
import FloatingElements from "@/components/FloatingElements";

const Index = () => {
  const [item, setItem] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    price: string;
    comparisons: { text: string; emoji: string }[];
  }>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!item.trim()) {
      toast.error("Please enter an item first!");
      return;
    }

    setLoading(true);
    try {
      console.log('DEBUG: Index - Calling calculateWorthComparisons for item:', item);
      const worthResult = await calculateWorthComparisons(item, country);
      console.log('DEBUG: Index - Received result:', worthResult);
      setResult(worthResult);
      setShowConfetti(true);

      // Scroll to results after a short delay to let the animation start
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

      // Reset confetti after animation completes
      setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
    } catch (error) {
      console.error("DEBUG: Error in handleAnalyze:", error);
      toast.error("Oops! Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    
    // Create share text
    const shareText = `Is a ${item} really worth it? ${result.price}\n\nSome ridiculous comparisons:\n• ${result.comparisons.slice(0, 3).map(c => c.text).join('\n• ')}`;
    
    if (navigator.share) {
      navigator.share({
        title: "Is It Worth It?",
        text: shareText,
        url: window.location.href,
      }).catch(err => {
        console.error("Share failed:", err);
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success("Copied to clipboard! Share this madness!");
      });
    }
  };

  const countries = [
    { value: "af", label: "Afghanistan" },
    { value: "al", label: "Albania" },
    { value: "dz", label: "Algeria" },
    { value: "ad", label: "Andorra" },
    { value: "ao", label: "Angola" },
    { value: "ag", label: "Antigua and Barbuda" },
    { value: "ar", label: "Argentina" },
    { value: "am", label: "Armenia" },
    { value: "au", label: "Australia" },
    { value: "at", label: "Austria" },
    { value: "az", label: "Azerbaijan" },
    { value: "bs", label: "Bahamas" },
    { value: "bh", label: "Bahrain" },
    { value: "bd", label: "Bangladesh" },
    { value: "bb", label: "Barbados" },
    { value: "by", label: "Belarus" },
    { value: "be", label: "Belgium" },
    { value: "bz", label: "Belize" },
    { value: "bj", label: "Benin" },
    { value: "bt", label: "Bhutan" },
    { value: "bo", label: "Bolivia" },
    { value: "ba", label: "Bosnia and Herzegovina" },
    { value: "bw", label: "Botswana" },
    { value: "br", label: "Brazil" },
    { value: "bn", label: "Brunei" },
    { value: "bg", label: "Bulgaria" },
    { value: "bf", label: "Burkina Faso" },
    { value: "bi", label: "Burundi" },
    { value: "cv", label: "Cabo Verde" },
    { value: "kh", label: "Cambodia" },
    { value: "cm", label: "Cameroon" },
    { value: "ca", label: "Canada" },
    { value: "cf", label: "Central African Republic" },
    { value: "td", label: "Chad" },
    { value: "cl", label: "Chile" },
    { value: "cn", label: "China" },
    { value: "co", label: "Colombia" },
    { value: "km", label: "Comoros" },
    { value: "cg", label: "Congo" },
    { value: "cr", label: "Costa Rica" },
    { value: "hr", label: "Croatia" },
    { value: "cu", label: "Cuba" },
    { value: "cy", label: "Cyprus" },
    { value: "cz", label: "Czech Republic" },
    { value: "dk", label: "Denmark" },
    { value: "dj", label: "Djibouti" },
    { value: "dm", label: "Dominica" },
    { value: "do", label: "Dominican Republic" },
    { value: "ec", label: "Ecuador" },
    { value: "eg", label: "Egypt" },
    { value: "sv", label: "El Salvador" },
    { value: "gq", label: "Equatorial Guinea" },
    { value: "er", label: "Eritrea" },
    { value: "ee", label: "Estonia" },
    { value: "sz", label: "Eswatini" },
    { value: "et", label: "Ethiopia" },
    { value: "fj", label: "Fiji" },
    { value: "fi", label: "Finland" },
    { value: "fr", label: "France" },
    { value: "ga", label: "Gabon" },
    { value: "gm", label: "Gambia" },
    { value: "ge", label: "Georgia" },
    { value: "de", label: "Germany" },
    { value: "gh", label: "Ghana" },
    { value: "gr", label: "Greece" },
    { value: "gd", label: "Grenada" },
    { value: "gt", label: "Guatemala" },
    { value: "gn", label: "Guinea" },
    { value: "gw", label: "Guinea-Bissau" },
    { value: "gy", label: "Guyana" },
    { value: "ht", label: "Haiti" },
    { value: "hn", label: "Honduras" },
    { value: "hu", label: "Hungary" },
    { value: "is", label: "Iceland" },
    { value: "in", label: "India" },
    { value: "id", label: "Indonesia" },
    { value: "ir", label: "Iran" },
    { value: "iq", label: "Iraq" },
    { value: "ie", label: "Ireland" },
    { value: "il", label: "Israel" },
    { value: "it", label: "Italy" },
    { value: "jm", label: "Jamaica" },
    { value: "jp", label: "Japan" },
    { value: "jo", label: "Jordan" },
    { value: "kz", label: "Kazakhstan" },
    { value: "ke", label: "Kenya" },
    { value: "ki", label: "Kiribati" },
    { value: "kp", label: "North Korea" },
    { value: "kr", label: "South Korea" },
    { value: "kw", label: "Kuwait" },
    { value: "kg", label: "Kyrgyzstan" },
    { value: "la", label: "Laos" },
    { value: "lv", label: "Latvia" },
    { value: "lb", label: "Lebanon" },
    { value: "ls", label: "Lesotho" },
    { value: "lr", label: "Liberia" },
    { value: "ly", label: "Libya" },
    { value: "li", label: "Liechtenstein" },
    { value: "lt", label: "Lithuania" },
    { value: "lu", label: "Luxembourg" },
    { value: "mg", label: "Madagascar" },
    { value: "mw", label: "Malawi" },
    { value: "my", label: "Malaysia" },
    { value: "mv", label: "Maldives" },
    { value: "ml", label: "Mali" },
    { value: "mt", label: "Malta" },
    { value: "mh", label: "Marshall Islands" },
    { value: "mr", label: "Mauritania" },
    { value: "mu", label: "Mauritius" },
    { value: "mx", label: "Mexico" },
    { value: "fm", label: "Micronesia" },
    { value: "md", label: "Moldova" },
    { value: "mc", label: "Monaco" },
    { value: "mn", label: "Mongolia" },
    { value: "me", label: "Montenegro" },
    { value: "ma", label: "Morocco" },
    { value: "mz", label: "Mozambique" },
    { value: "mm", label: "Myanmar" },
    { value: "na", label: "Namibia" },
    { value: "nr", label: "Nauru" },
    { value: "np", label: "Nepal" },
    { value: "nl", label: "Netherlands" },
    { value: "nz", label: "New Zealand" },
    { value: "ni", label: "Nicaragua" },
    { value: "ne", label: "Niger" },
    { value: "ng", label: "Nigeria" },
    { value: "mk", label: "North Macedonia" },
    { value: "no", label: "Norway" },
    { value: "om", label: "Oman" },
    { value: "pk", label: "Pakistan" },
    { value: "pw", label: "Palau" },
    { value: "pa", label: "Panama" },
    { value: "pg", label: "Papua New Guinea" },
    { value: "py", label: "Paraguay" },
    { value: "pe", label: "Peru" },
    { value: "ph", label: "Philippines" },
    { value: "pl", label: "Poland" },
    { value: "pt", label: "Portugal" },
    { value: "qa", label: "Qatar" },
    { value: "ro", label: "Romania" },
    { value: "ru", label: "Russia" },
    { value: "rw", label: "Rwanda" },
    { value: "kn", label: "Saint Kitts and Nevis" },
    { value: "lc", label: "Saint Lucia" },
    { value: "vc", label: "Saint Vincent and the Grenadines" },
    { value: "ws", label: "Samoa" },
    { value: "sm", label: "San Marino" },
    { value: "st", label: "Sao Tome and Principe" },
    { value: "sa", label: "Saudi Arabia" },
    { value: "sn", label: "Senegal" },
    { value: "rs", label: "Serbia" },
    { value: "sc", label: "Seychelles" },
    { value: "sl", label: "Sierra Leone" },
    { value: "sg", label: "Singapore" },
    { value: "sk", label: "Slovakia" },
    { value: "si", label: "Slovenia" },
    { value: "sb", label: "Solomon Islands" },
    { value: "so", label: "Somalia" },
    { value: "za", label: "South Africa" },
    { value: "ss", label: "South Sudan" },
    { value: "es", label: "Spain" },
    { value: "lk", label: "Sri Lanka" },
    { value: "sd", label: "Sudan" },
    { value: "sr", label: "Suriname" },
    { value: "se", label: "Sweden" },
    { value: "ch", label: "Switzerland" },
    { value: "sy", label: "Syria" },
    { value: "tw", label: "Taiwan" },
    { value: "tj", label: "Tajikistan" },
    { value: "tz", label: "Tanzania" },
    { value: "th", label: "Thailand" },
    { value: "tl", label: "Timor-Leste" },
    { value: "tg", label: "Togo" },
    { value: "to", label: "Tonga" },
    { value: "tt", label: "Trinidad and Tobago" },
    { value: "tn", label: "Tunisia" },
    { value: "tr", label: "Turkey" },
    { value: "tm", label: "Turkmenistan" },
    { value: "tv", label: "Tuvalu" },
    { value: "ug", label: "Uganda" },
    { value: "ua", label: "Ukraine" },
    { value: "ae", label: "United Arab Emirates" },
    { value: "gb", label: "United Kingdom" },
    { value: "us", label: "United States" },
    { value: "uy", label: "Uruguay" },
    { value: "uz", label: "Uzbekistan" },
    { value: "vu", label: "Vanuatu" },
    { value: "va", label: "Vatican City" },
    { value: "ve", label: "Venezuela" },
    { value: "vn", label: "Vietnam" },
    { value: "ye", label: "Yemen" },
    { value: "zm", label: "Zambia" },
    { value: "zw", label: "Zimbabwe" }
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden pb-16">
      <MoneyRain />
      <FloatingElements />
      {showConfetti && <ConfettiExplosion />}
      
      <div className="container max-w-4xl mx-auto px-4 pt-10 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-neon-purple to-pink-500 text-transparent bg-clip-text animate-pulse-scale">
            Is That Really Worth It?
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-700">
            Find out if your guilty pleasure makes financial sense... or is absolutely RIDICULOUS!
          </p>
        </div>

        <div className="space-y-6 bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-100">
          <div className="space-y-2">
            <label htmlFor="item" className="text-lg font-medium block">
              What's your guilty pleasure?
            </label>
            <Input
              id="item"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Porsche 911, Golden Retriever, Avocado Toast..."
              className="text-lg h-12 border-2 border-purple-200 focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="text-lg font-medium block">
              Want a country flavor? (optional)
            </label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-12 border-2 border-purple-200">
                <SelectValue placeholder="Select a country (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific country</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={loading} 
            className="w-full h-14 text-xl font-bold uppercase bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 button-shine"
          >
            {loading ? (
              <span className="flex items-center">
                Analyzing this mess...
                <Sparkles className="ml-2 animate-spin" />
              </span>
            ) : (
              <span className="flex items-center">
                Analyse this mess
                <Sparkles className="ml-2" />
              </span>
            )}
          </Button>
        </div>

        {result && (
          <div 
            ref={resultsRef}
            className="mt-12 space-y-6 relative z-10"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-800">
                The Absurd Results
              </h2>
              <Button 
                onClick={handleShare}
                variant="outline"
                className="flex items-center border-2 border-purple-300 hover:border-purple-500"
              >
                <Share className="mr-2 h-4 w-4" />
                Share This Madness
              </Button>
            </div>

            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-center mb-2">Estimated Price of {item}</h3>
                <p className="text-5xl md:text-6xl font-bold text-center text-green-600 mb-6">
                  {result.price}
                </p>
                
                <h4 className="text-xl font-bold mb-4 text-center text-purple-800">
                  Your {item} is equivalent to:
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.comparisons.map((comparison, index) => (
                    <Card 
                      key={index} 
                      className="bg-white border-2 hover:border-neon-purple transition-all duration-300 hover:shadow-xl"
                    >
                      <CardContent className="p-4 flex items-center">
                        <span className="text-3xl mr-3">{comparison.emoji}</span>
                        <p className="text-md">{comparison.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
