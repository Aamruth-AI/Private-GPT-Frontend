import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload } from 'lucide-react'; // Ensure Upload icon is imported
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import logo from './assets/logo.jpeg';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist/webpack'; // Import pdfjs

// Set the workerSrc property (required for pdfjs)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPDFText, setUploadedPDFText] = useState(''); // Store extracted PDF text
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Function to handle sending messages
  const handleSend = async () => {
    if (input.trim() === '' || isSending) return;

    setMessages(prev => [...prev, { text: input, isUser: true }]);
    setInput('');
    setIsSending(true);

    try {
      // Here, you can utilize `uploadedPDFText` if needed
      // For now, we'll just echo the input as if processing

      // Simulate a response after processing
      setTimeout(() => {
        setMessages(prev => [...prev, { text: `You said: "${input}"`, isUser: false }]);
        setIsSending(false);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'Sorry, there was an error processing your request.', isUser: false }]);
      setIsSending(false);
    }
  };

  // Function to handle PDF upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setMessages(prev => [...prev, { text: 'Only PDF files are allowed.', isUser: false }]);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    };

    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target.result);

        // Load the PDF
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let textContent = '';

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          textContent += pageText + '\n';
        }

        setUploadedPDFText(textContent);
        setMessages(prev => [...prev, { text: `Successfully uploaded and processed ${file.name}. You can now ask questions related to the document.`, isUser: false }]);
      } catch (error) {
        console.error('PDF Processing Error:', error);
        setMessages(prev => [...prev, { text: 'Failed to process the PDF. Please try another file.', isUser: false }]);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader Error:', error);
      setMessages(prev => [...prev, { text: 'Failed to read the file. Please try again.', isUser: false }]);
      setIsUploading(false);
      setUploadProgress(0);
    };

    reader.readAsArrayBuffer(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-full max-w-[90vw] lg:max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-300">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 py-4 px-8 flex items-center justify-center bg-white shadow-md z-10 rounded-t-2xl">
        <div className="absolute left-8 flex items-center space-x-4">
          <img src={logo} alt="Company Logo" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide">Intipal</h1>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow mt-16 overflow-auto p-8 bg-white rounded-lg shadow-inner">
        <div className="text-center mb-12 text-gray-700 text-lg font-medium bg-gray-100 p-4 rounded-lg shadow">
          Intipal
        </div>
        {messages.length === 0 ? (
          <div className="text-gray-600 text-center pt-16 animate-fade-in-out text-2xl">
            Let's get started! Upload a PDF or ask me anything...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`inline-block px-6 py-4 rounded-2xl shadow-lg max-w-md ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                }`}>
                  {message.isUser ? (
                    message.text
                  ) : (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <div className="flex justify-center mb-4">
        <Button 
          onClick={triggerFileInput} 
          disabled={isUploading} 
          className={`flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
          }`}
        >
          <Upload size={20} />
          <span>Upload PDF</span>
        </Button>
        <input 
          type="file" 
          accept="application/pdf" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex justify-center mb-4">
          <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <span className="ml-4 text-gray-700">{uploadProgress}%</span>
        </div>
      )}

      {/* Input and Send Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-300 shadow-md z-10 rounded-b-2xl">
        <div className="flex items-center space-x-3 px-4">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-grow focus:ring-4 focus:ring-blue-400 rounded-full shadow-md px-4 py-2 text-lg"
            disabled={isSending || isUploading}
          />
          <Button 
            onClick={handleSend} 
            disabled={isSending || isUploading || !uploadedPDFText}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 ease-in-out transform ${
              isSending || isUploading || !uploadedPDFText ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            <Send size={24} />
          </Button>
        </div>
        {isUploading && (
          <div className="mt-2 text-center text-gray-500">
            Uploading PDF...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
