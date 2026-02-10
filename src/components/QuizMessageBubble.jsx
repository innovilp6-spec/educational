import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
// import RadioButton from '@react-native-community/radio-buttons-group';

/**
 * Quiz Message Bubble Component
 * Displays MCQ questions with interactive answer selection
 * Users select answers and submit within the message bubble
 */
export const QuizMessageBubble = ({
  quiz,
  quizSessionId,
  onSubmitAnswers,
  isSubmitting,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showValidation, setShowValidation] = useState(false);

  const handleSelectAnswer = (questionId, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    setShowValidation(false);
  };

  const handleSubmitQuiz = () => {
    // Validate all questions answered
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < quiz.questions.length) {
      setShowValidation(true);
      return;
    }

    onSubmitAnswers({
      quizSessionId,
      answers: selectedAnswers,
    });
  };

  const isAnswerSelected = (questionId) => questionId in selectedAnswers;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = quiz.questions.length;

  return (
    <View style={styles.quizContainer}>
      {/* Quiz Header */}
      <View style={styles.quizHeader}>
        <Text style={styles.quizTitle}>{quiz.quizTitle}</Text>
        <Text style={styles.quizMeta}>
          Topic: <Text style={styles.topicText}>{quiz.topic}</Text>
        </Text>
        <Text style={styles.progressText}>
          {answeredCount} of {totalQuestions} answered
        </Text>
      </View>

      {/* Questions */}
      <ScrollView style={styles.questionsScroll} nestedScrollEnabled>
        {quiz.questions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            {/* Question Text */}
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Q{index + 1}</Text>
              <Text style={styles.questionText}>{question.question}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {Object.entries(question.options).map(([optionKey, optionText]) => (
                <TouchableOpacity
                  key={optionKey}
                  style={[
                    styles.optionButton,
                    selectedAnswers[question.id] === optionKey &&
                      styles.optionButtonSelected,
                  ]}
                  onPress={() => handleSelectAnswer(question.id, optionKey)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selectedAnswers[question.id] === optionKey &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {selectedAnswers[question.id] === optionKey && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedAnswers[question.id] === optionKey &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {optionKey}. {optionText}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Indicator */}
            {isAnswerSelected(question.id) && (
              <View style={styles.answerIndicator}>
                <Text style={styles.answerIndicatorText}>✓ Answered</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Validation Message */}
      {showValidation && (
        <View style={styles.validationMessage}>
          <Text style={styles.validationText}>
            ⚠ Please answer all {totalQuestions} questions before submitting
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
          answeredCount < totalQuestions && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmitQuiz}
        disabled={isSubmitting || answeredCount < totalQuestions}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </>
        ) : (
          <Text style={styles.submitButtonText}>
            Submit Quiz ({answeredCount}/{totalQuestions})
          </Text>
        )}
      </TouchableOpacity>

      {/* Quiz Info */}
      <View style={styles.quizFooter}>
        <Text style={styles.quizInfoText}>
          Passing Marks: {quiz.passingMarks}%
        </Text>
      </View>
    </View>
  );
};

/**
 * Quiz Results Message Bubble Component
 * Displays marks, remarks, and detailed feedback
 */
export const QuizResultsBubble = ({
  evaluation,
  quiz,
}) => {
  const [expandedResult, setExpandedResult] = useState(null);

  const getPerformanceColor = (marks) => {
    if (marks >= 80) return '#4CAF50'; // Green
    if (marks >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getPerformanceLabel = (marks) => {
    if (marks >= 90) return '🌟 Excellent!';
    if (marks >= 80) return '👏 Great!';
    if (marks >= 70) return '✨ Good!';
    if (marks >= 60) return '💪 Try Again';
    return '📚 Keep Learning!';
  };

  return (
    <View style={styles.resultsContainer}>
      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Quiz Completed!</Text>
        <Text style={styles.resultsSubtitle}>{quiz.quizTitle}</Text>
      </View>

      {/* Score Display */}
      <View style={[styles.scoreBox, { borderLeftColor: getPerformanceColor(evaluation.marksObtained) }]}>
        <View style={styles.scoreContent}>
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text
            style={[
              styles.scoreValue,
              { color: getPerformanceColor(evaluation.marksObtained) },
            ]}
          >
            {evaluation.marksObtained}%
          </Text>
          <Text style={styles.scoreDetail}>
            {evaluation.correctAnswers} out of {evaluation.totalQuestions} correct
          </Text>
        </View>
        <Text style={styles.performanceLabel}>
          {getPerformanceLabel(evaluation.marksObtained)}
        </Text>
      </View>

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          evaluation.isPassed
            ? styles.statusBadgePassed
            : styles.statusBadgeFailed,
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            evaluation.isPassed
              ? styles.statusBadgeTextPassed
              : styles.statusBadgeTextFailed,
          ]}
        >
          {evaluation.isPassed ? '✓ PASSED' : '✗ TRY AGAIN'}
        </Text>
      </View>

      {/* Remarks */}
      <View style={styles.remarksSection}>
        <Text style={styles.remarksLabel}>Feedback</Text>
        <Text style={styles.remarksText}>{evaluation.remarks}</Text>
      </View>

      {/* Detailed Results */}
      <View style={styles.detailedResultsSection}>
        <Text style={styles.detailedResultsLabel}>Answer Review</Text>
        {evaluation.detailedResults.map((result, index) => (
          <TouchableOpacity
            key={result.questionId}
            style={styles.resultItem}
            onPress={() =>
              setExpandedResult(
                expandedResult === result.questionId ? null : result.questionId
              )
            }
          >
            <View style={styles.resultItemHeader}>
              <View
                style={[
                  styles.resultIndicator,
                  result.isCorrect
                    ? styles.resultIndicatorCorrect
                    : styles.resultIndicatorIncorrect,
                ]}
              >
                <Text style={styles.resultIndicatorText}>
                  {result.isCorrect ? '✓' : '✗'}
                </Text>
              </View>
              <View style={styles.resultItemContent}>
                <Text style={styles.resultQuestion} numberOfLines={2}>
                  Q{index + 1}: {result.question}
                </Text>
                <Text
                  style={[
                    styles.resultStatus,
                    result.isCorrect
                      ? styles.resultStatusCorrect
                      : styles.resultStatusIncorrect,
                  ]}
                >
                  {result.isCorrect
                    ? 'Correct'
                    : `Your answer: ${result.userAnswer}`}
                </Text>
              </View>
              <Text style={styles.expandIcon}>
                {expandedResult === result.questionId ? '▼' : '▶'}
              </Text>
            </View>

            {/* Expanded Details */}
            {expandedResult === result.questionId && (
              <View style={styles.resultDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Your Answer:</Text>
                  <Text style={styles.detailValue}>{result.userAnswer}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Correct Answer:</Text>
                  <Text style={styles.detailValue}>{result.correctAnswer}</Text>
                </View>
                {result.explanation && (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLabel}>💡 Explanation</Text>
                    <Text style={styles.explanationText}>
                      {result.explanation}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer Stats */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Correct</Text>
          <Text style={[styles.statValue, styles.statValueCorrect]}>
            {evaluation.correctAnswers}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Incorrect</Text>
          <Text style={[styles.statValue, styles.statValueIncorrect]}>
            {evaluation.totalQuestions - evaluation.correctAnswers}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>
            {((evaluation.correctAnswers / evaluation.totalQuestions) * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Quiz Bubble Styles
  quizContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    maxWidth: '95%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 8,
  },

  quizHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },

  quizMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  topicText: {
    fontWeight: '600',
    color: '#000',
  },

  progressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  questionsScroll: {
    maxHeight: 400,
    marginBottom: 12,
  },

  questionCard: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },

  questionHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  questionNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 8,
    minWidth: 24,
  },

  questionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },

  optionsContainer: {
    marginBottom: 8,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  optionButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },

  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  radioCircleSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },

  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  optionText: {
    fontSize: 12,
    color: '#555',
    flex: 1,
  },

  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },

  answerIndicator: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },

  answerIndicatorText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },

  validationMessage: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },

  validationText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },

  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },

  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },

  submitButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  quizFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  quizInfoText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },

  // Results Bubble Styles
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    maxWidth: '95%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 8,
  },

  resultsHeader: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  resultsSubtitle: {
    fontSize: 12,
    color: '#999',
  },

  scoreBox: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  scoreContent: {
    flex: 1,
  },

  scoreLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },

  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  scoreDetail: {
    fontSize: 12,
    color: '#666',
  },

  performanceLabel: {
    fontSize: 28,
    marginLeft: 12,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },

  statusBadgePassed: {
    backgroundColor: '#C8E6C9',
  },

  statusBadgeFailed: {
    backgroundColor: '#FFCDD2',
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  statusBadgeTextPassed: {
    color: '#2E7D32',
  },

  statusBadgeTextFailed: {
    color: '#C62828',
  },

  remarksSection: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },

  remarksLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 6,
  },

  remarksText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  detailedResultsSection: {
    marginBottom: 12,
  },

  detailedResultsLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },

  resultItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  resultItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
  },

  resultIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  resultIndicatorCorrect: {
    backgroundColor: '#C8E6C9',
  },

  resultIndicatorIncorrect: {
    backgroundColor: '#FFCDD2',
  },

  resultIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  resultItemContent: {
    flex: 1,
  },

  resultQuestion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },

  resultStatus: {
    fontSize: 11,
    marginTop: 2,
  },

  resultStatusCorrect: {
    color: '#2E7D32',
    fontWeight: '600',
  },

  resultStatusIncorrect: {
    color: '#C62828',
  },

  expandIcon: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },

  resultDetails: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },

  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },

  explanationBox: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#2196F3',
  },

  explanationLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },

  explanationText: {
    fontSize: 11,
    color: '#333',
    lineHeight: 16,
  },

  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  statValueCorrect: {
    color: '#4CAF50',
  },

  statValueIncorrect: {
    color: '#F44336',
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
});
