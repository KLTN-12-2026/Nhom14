import chatbot from '../../assets/chatbot.png'

const Hero = () => {
  return (
    <section className="bg-yellow-300 h-auto">

        <div className="max-w-7xl mx-auto flex">
            <div className="flex flex-1 justify-end items-center"> 
              <button className="h-10 rounded-full border-2 border-white 
              hover:shadow-lg hover:scale-105 hover:text-yellow-300 transition-all duration-300 
              cursor-pointer active:scale-95">
                <img src={chatbot} alt="Chatbot" className="h-10" />
              </button>
            </div>
        </div>

    </section>
  )
}

export default Hero
