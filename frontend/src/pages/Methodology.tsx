import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  HelpCircle, 
  GitBranch, 
  Scale, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  FileCode
} from 'lucide-react';

interface VivaQuestion {
  question: string;
  category: string;
  answer: string;
}

export const Methodology: React.FC = () => {
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(0);

  const vivaQuestions: VivaQuestion[] = [
    {
      question: "What machine learning problem does PITCHIQ solve?",
      category: "Problem Formulation",
      answer: "PITCHIQ solves a supervised multiclass classification problem. Given pre-match historical records of two competing football clubs, it estimates the probability distribution across three mutually exclusive discrete outcome states: Home Win (H), Draw (D), and Away Win (A)."
    },
    {
      question: "Why is this formulated as classification instead of regression on final goal scores?",
      category: "Formulation Justification",
      answer: "While goal regression (e.g. Poisson or negative binomial modeling) is valid, football matches are zero-sum points contests decided by outcome thresholds. Direct multiclass classification targets the decision boundary between winning, drawing, and losing directly, optimizing for log-loss and discrete outcome likelihoods without introducing secondary errors from goal estimation rounding."
    },
    {
      question: "What constitutes data leakage in sports forecasting, and how does PITCHIQ prevent it?",
      category: "Data Integrity & Causality",
      answer: "Data leakage occurs whenever features for a match incorporate information that was not causally available prior to kickoff. This includes: (1) using the target match's final score or cards to compute team form, (2) computing rolling statistics without shifting the current row, or (3) fitting feature scalers across the full dataset before train/test splitting. PITCHIQ eliminates leakage by strictly filtering prior match history (Date < match_date), shifting rolling windows, and fitting StandardScaler strictly on the training partition."
    },
    {
      question: "Why is standard random k-fold cross validation strictly invalid for this dataset?",
      category: "Validation Strategy",
      answer: "Random k-fold randomly shuffles matches across the 2021–2025 timeline. If a match from May 2024 is in the training set while an earlier match from October 2023 is in the test set, the model evaluates 'past' events while already possessing trained knowledge of team tactics and form from the 'future'. PITCHIQ enforces a chronological train/test split (Train: Sept 2021 – Sept 2024; Test: Sept 2024 – May 2025), accurately simulating real-world production forecasting on unseen future games."
    },
    {
      question: "What does Macro F1 measure, and why is accuracy insufficient on its own?",
      category: "Evaluation Metrics",
      answer: "In the Premier League, Home Wins historically occur ~44% of the time, Away Wins ~32%, and Draws ~24%. A naive DummyClassifier can achieve 42% accuracy by blindly guessing Home Win every time. However, its Macro F1 is catastrophic (~0.197) because its recall for Draws and Away Wins is exactly zero. Macro F1 calculates the unweighted mean of F1-scores across all three classes, penalizing models that ignore minority or harder classes."
    },
    {
      question: "Why is predicting Draws notoriously challenging in football analytics?",
      category: "Domain Specifics",
      answer: "Draws represent an unstable equilibrium in football. Teams enter matches aiming to win; draws often emerge from low-probability events such as late defensive errors, missed penalties, or low-scoring stalemates. Because draws represent only ~23% of matches, classification algorithms exhibit lower precision and recall for draws unless specifically calibrated."
    },
    {
      question: "How does the Random Forest classifier function within PITCHIQ's pipeline?",
      category: "Algorithm Architecture",
      answer: "The pipeline bundles a Scikit-Learn StandardScaler with an ensemble of 180 decorrelated Decision Trees using bootstrap aggregation (bagging) and random feature subspace sampling (max_features='sqrt'). Balanced subsample weighting is applied to counteract class imbalance. Each individual tree votes on the outcome, and the ensemble outputs the normalized class probability distribution via predict_proba."
    },
    {
      question: "What are the Brier Score and Multiclass Log Loss, and what do they indicate?",
      category: "Calibration Metrics",
      answer: "Brier Score measures the mean squared difference between predicted probability vectors and one-hot true outcome vectors (lower is better; 0 is perfect). Multiclass Log Loss heavily penalizes overconfident wrong predictions (-log(p_true)). On our held-out test set, PITCHIQ achieves a Brier score of 0.6313 and Log Loss of 1.0498, demonstrating stable calibration."
    },
    {
      question: "Why does football outcome prediction have an inherent theoretical ceiling (~45-55%)?",
      category: "Epistemological Boundaries",
      answer: "Football has the lowest scoring rate among major team sports (~2.8 goals per match). High variance events—such as red cards in the 12th minute, deflected shots, referee decisions, or sudden muscle injuries—carry massive leverage over final results. Because these stochastic events occur during play, pre-match statistical models possess a natural Bayes optimal error rate around 45–55%."
    },
    {
      question: "What future enhancements could build upon this pipeline?",
      category: "Future Work",
      answer: "Viable future extensions include: (1) integrating player-level Expected Goals (xG) and shot-quality metrics, (2) adding real-time starting lineup confirmations 60 minutes before kickoff, (3) evaluating Poisson or Dixon-Coles bivariate goal regression benchmarks, and (4) continuous Bayesian updating as new matchdays conclude."
    }
  ];

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <div className="section-label">Academic Foundations & Viva Guide</div>
          <h1 className="page-title">Methodology & Technical Specifications</h1>
          <p className="page-subtitle">
            Comprehensive documentation of mathematical formulation, data leakage safeguards, 
            pipeline architecture, and viva examination preparation for Machine Learning Experiment 11.
          </p>
        </div>
      </section>

      <section className="container">
        {/* Core Mathematical Formulation */}
        <div className="editorial-card-elevated" style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Scale size={20} color="var(--accent-moss)" />
            <h2 style={{ fontSize: '24px' }}>Mathematical Problem Formulation</h2>
          </div>
          <p style={{ fontSize: '15px', color: 'var(--text-parchment)', lineHeight: '1.7', marginBottom: '16px' }}>
            Let a football fixture M_i = (H_i, A_i, t_i) represent a match scheduled between home team H_i and away team A_i at kickoff time t_i. 
            The target variable Y_i ∈ {'{'}H, D, A{'}'} is a discrete label determined by full-time goals:
          </p>
          <div style={{
            backgroundColor: 'var(--bg-deep)',
            padding: '16px 24px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#6EE7B7',
            marginBottom: '16px',
            border: '1px solid var(--border-subtle)'
          }}>
            Y_i = H  if  FTHG_i &gt; FTAG_i<br />
            Y_i = D  if  FTHG_i == FTAG_i<br />
            Y_i = A  if  FTHG_i &lt; FTAG_i
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-sage)', lineHeight: '1.6' }}>
            The objective of the model is to learn a mapping f: x_i → p_i = [p_H, p_D, p_A] where p_H + p_D + p_A = 1.0, minimizing the multiclass cross-entropy loss over held-out chronological matches.
          </p>
        </div>

        {/* Causal Feature Engineering Rules */}
        <div className="grid-2" style={{ marginBottom: '36px' }}>
          <div className="editorial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={18} color="#6EE7B7" />
              <h3 style={{ fontSize: '18px' }}>Temporal Filtration Invariant</h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-sage)', lineHeight: '1.6' }}>
              For any fixture M_i occurring on date t_i, the feature vector x_i is constructed exclusively from the historical subset:
            </p>
            <div style={{
              margin: '12px 0',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-deep)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: 'var(--text-ivory)'
            }}>
              D_prior(M_i) = {'{'} M_k ∈ D | t_k &lt; t_i {'}'}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No in-game statistics, closing odds, or subsequent matches are accessible during feature calculation.
            </p>
          </div>

          <div className="editorial-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <GitBranch size={18} color="#38BDF8" />
              <h3 style={{ fontSize: '18px' }}>Rolling Window Formulation</h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-sage)', lineHeight: '1.6' }}>
              Points Per Game (PPG) over a backward window W=5 is formulated as:
            </p>
            <div style={{
              margin: '12px 0',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-deep)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: 'var(--text-ivory)'
            }}>
              PPG(T, W) = (1 / W) * Σ Points(Match_j)
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Venue-specific splits (home PPG when playing at home; away PPG when playing away) isolate venue dominance.
            </p>
          </div>
        </div>

        {/* Viva Examination Interactive Guide */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <HelpCircle size={22} color="var(--accent-moss)" />
            <h2 style={{ fontSize: '26px' }}>Viva Examination Defense Guide</h2>
          </div>
          <p style={{ color: 'var(--text-sage)', fontSize: '14.5px', marginBottom: '24px' }}>
            Key theoretical and practical questions frequently posed during academic Machine Learning project vivas, 
            complete with mathematically defensible explanations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vivaQuestions.map((q, idx) => {
              const isOpen = openQuestionIndex === idx;
              return (
                <div 
                  key={idx}
                  className="editorial-card"
                  style={{
                    padding: '20px 24px',
                    borderColor: isOpen ? 'var(--border-prominent)' : 'var(--border-subtle)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div 
                    onClick={() => setOpenQuestionIndex(isOpen ? null : idx)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <span style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--accent-moss)',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        {q.category} • Q{idx + 1}
                      </span>
                      <h4 style={{ fontSize: '16.5px', color: 'var(--text-ivory)' }}>
                        {q.question}
                      </h4>
                    </div>
                    <div style={{ color: 'var(--text-sage)', paddingLeft: '16px' }}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '14.5px',
                      color: 'var(--text-parchment)',
                      lineHeight: '1.7'
                    }}>
                      {q.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
