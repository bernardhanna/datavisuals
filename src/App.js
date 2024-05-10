/**
 * @Author: Bernard Hanna
 * @Date:   2023-12-12 13:24:24
 * @Last Modified by:   Bernard Hanna
 * @Last Modified time: 2023-12-13 18:49:57
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
import './App.css';
import questions from './questions.json';

function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechAnswer, setSpeechAnswer] = useState('');
  const [correctAnswerCount, setCorrectAnswerCount] = useState(0);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const recognitionRef = useRef(null);

  currentQuestionIndexRef.current = currentQuestionIndex;

  const fuzzyMatch = (input, answer) => {
    const options = { includeScore: true, threshold: 0.6 }; // Adjust threshold as needed
    const fuse = new Fuse([answer], options);
    const result = fuse.search(input);
  
    return result.length > 0 && result[0].score <= options.threshold;
  };

  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;

      recognitionRef.current.onresult = event => {
        const last = event.results.length - 1;
        const result = event.results[last][0].transcript.trim().toLowerCase();
        setSpeechAnswer(result);
      
        const isCorrectAnswer = fuzzyMatch(result, questions[currentQuestionIndexRef.current].answer.toLowerCase());
      
        if (isCorrectAnswer) {
          setCorrectAnswerCount(prevCount => {
            const newCount = prevCount + 1;
            if (newCount === 5) {
              // Reset count and move to the next question
              setCorrectAnswerCount(0);
              moveToNextQuestion();
            }
            return newCount;
          });
        }
      };
    }
  }, []);

  useEffect(() => {
    initializeSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [initializeSpeechRecognition]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.start();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setIsListening(true); // Optionally start listening immediately when the quiz starts
  };

  const randomizeQuestions = () => {
  // eslint-disable-next-line no-unused-vars
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  };

  const moveToNextQuestion = () => {
    setCurrentQuestionIndex(prevIndex => {
      setCorrectAnswerCount(0); // Reset correct answer count
      setSpeechAnswer('');
      setShowAnswer(false);
  
      if (prevIndex < questions.length - 1) {
        return prevIndex + 1;
      } else {
        return 0; // Reset the index to 0 to start from the first question
      }
    });
  };

  const moveToPreviousQuestion = () => {
    setCurrentQuestionIndex(prevIndex => {
      if (prevIndex > 0) {
        setCorrectAnswerCount(0); // Reset correct answer count
        setSpeechAnswer('');
        setShowAnswer(false);
        return prevIndex - 1;
      } else {
        return prevIndex;
      }
    });
  };

  const handleSpeechInputToggle = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="App h-screen bg-black">
      {!quizStarted ? (
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={startQuiz}>
          Start Quiz
        </button>
      ) : (
        <div className="pv-12">
          <div className="text-lg font-semibold mb-2 pt-12 text-white">
            Question: {questions[currentQuestionIndex].question}
          </div>
          {showAnswer && <div className="text-lg text-white">Answer: {questions[currentQuestionIndex].answer}</div>}
          <div className="space-x-4 mt-4">
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={() => setShowAnswer(!showAnswer)}>
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={() => moveToNextQuestion()} disabled={currentQuestionIndex >= questions.length - 1}>
              Next
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded" onClick={moveToPreviousQuestion} disabled={currentQuestionIndex === 0}>
              Back
            </button>
          </div>
        </div>
      )}
      <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4" onClick={randomizeQuestions}>
        Randomize Questions
      </button>
      <button className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded mt-4" onClick={handleSpeechInputToggle}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <div class="text-white py-12">
        {speechAnswer && <span>Your Answer: {speechAnswer}</span>}
        <div class="py-12">Correct Answers: {correctAnswerCount}/5</div>
      </div>
    </div>
  );
}

export default App;