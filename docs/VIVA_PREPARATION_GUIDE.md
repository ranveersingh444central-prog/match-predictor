# PITCHIQ — University Machine Learning Experiment 11: Viva Preparation Guide

This viva guide equips you to defend the mathematical, architectural, and experimental decisions behind **PITCHIQ** with complete confidence.

---

## 1. Core Problem Formulation & Machine Learning Taxonomy

### Q1: What machine learning problem does PITCHIQ solve?
**Answer:**
PITCHIQ solves a **supervised multiclass classification problem**. Given pre-match historical records of two competing football clubs, the model maps pre-match statistics to a probability distribution over three mutually exclusive outcomes:
- **Home Win ($H$)**: Full-time home goals $>$ full-time away goals ($\text{FTHG} > \text{FTAG}$)
- **Draw ($D$)**: Full-time home goals $=$ full-time away goals ($\text{FTHG} = \text{FTAG}$)
- **Away Win ($A$)**: Full-time home goals $<$ full-time away goals ($\text{FTHG} < \text{FTAG}$)

Mathematically:
$$f: \mathbf{x}_i \in \mathbb{R}^{25} \to \mathbf{p}_i = [p_H, p_D, p_A]^T \quad \text{where} \quad \sum_{c \in \{H, D, A\}} p_c = 1.0$$

### Q2: Why formulate this as direct classification rather than predicting the scoreline (regression)?
**Answer:**
1. **Target alignment:** League points and outcomes are step functions ($3$ points for win, $1$ for draw, $0$ for loss). Regressing continuous goal counts and rounding introduces discretization error near the decision boundary (e.g., $1.4$ vs $1.3$ goals).
2. **Loss function calibration:** Direct classification minimizes cross-entropy / multiclass log loss, penalizing overconfidence and producing well-calibrated class probabilities ($p_H, p_D, p_A$) directly.
3. **Variance control:** Predicting exact scorelines (e.g. $4-3$) has high variance, whereas predicting the overall result class has substantially lower variance.

---

## 2. Critical Prevention of Data Leakage

### Q3: What is data leakage, and why is it fatal in sports outcome modeling?
**Answer:**
Data leakage occurs when information from the target match or future matches is inadvertently included in the feature set during training or evaluation. In sports forecasting, leakage renders evaluation metrics deceptively high during testing while causing catastrophic failure in live deployment.

Common forms of leakage:
1. **Target leakage:** Using full-time shots, red cards, or half-time results to predict full-time outcome.
2. **Chronological leakage:** Using matches from future dates to compute past rolling averages.
3. **Preprocessing leakage:** Fitting `StandardScaler` on the entire dataset prior to train/test partitioning.

### Q4: How does PITCHIQ mathematically prove zero leakage?
**Answer:**
1. **Temporal Filtration Invariant:** For match $M_i$ at time $t_i$, features are drawn strictly from:
   $$\mathcal{D}_{\text{prior}}(M_i) = \{ M_k \in \mathcal{D} \mid t_k < t_i \}$$
2. **Lagged Rolling Computation:** When computing 5-match rolling points or goals, the current match $M_i$ is excluded from its own rolling window (shifted lag).
3. **Isolated Preprocessing:** Preprocessing transformers (`StandardScaler`) are fitted strictly on $\mathcal{D}_{\text{train}}$ and merely transform $\mathcal{D}_{\text{test}}$.
4. **Automated Leakage Regression Test:** `test_future_data_leakage_prevention()` artificially corrupts future matches and verifies that pre-match feature vectors remain bit-for-bit identical.

---

## 3. Chronological vs. Random Splitting

### Q5: Why is standard random $k$-fold cross validation strictly invalid here?
**Answer:**
Random $k$-fold cross-validation shuffles observations independently of time. If a match from May 2024 is in the training fold while a match from October 2023 is in the test fold, the model learns from the future to predict the past. 

In production, models must forecast upcoming unseen games. Therefore, PITCHIQ enforces a **chronological split**:
- **Training partition:** 1,148 matches (2021-09-11 to 2024-09-28)
- **Held-out test partition:** 324 unseen matches (2024-09-28 to 2025-05-25)

---

## 4. Models & Algorithms

### Q6: Why is a baseline model mandatory, and what baseline did you choose?
**Answer:**
A machine learning model cannot claim success without beating a simple heuristic benchmark. In Premier League history, Home Wins occur in ~44% of matches. 

We implemented a `DummyClassifier(strategy="most_frequent")` as our control baseline. It blindly predicts Home Win ($H$) for every fixture:
- **Baseline Accuracy:** **41.98%**
- **Baseline Macro F1:** **0.1971** (severely degraded because Draw and Away Win recall is $0.0$)

### Q7: How does the Random Forest classifier work in your pipeline?
**Answer:**
Random Forest is an ensemble of $B=180$ de-correlated Decision Trees:
1. **Bootstrap Aggregation (Bagging):** Each tree is trained on a random bootstrap sample of the training data with replacement.
2. **Random Subspace Sampling:** At each split node, only $\sqrt{p}$ features (out of 25) are randomly considered, decorrelating individual trees.
3. **Balanced Subsample Weighting:** Weights classes inversely proportional to class frequencies to counteract class imbalance.
4. **Probability Aggregation:** Soft voting calculates outcome probability as the average class probability predicted across all 180 trees:
   $$P(Y = c \mid \mathbf{x}) = \frac{1}{B} \sum_{b=1}^B P_b(Y = c \mid \mathbf{x})$$

---

## 5. Evaluation Metrics & Confusion Matrix

### Q8: What were your measured results on the unseen test set?
**Answer:**
On the 324 chronologically held-out matches:
- **Accuracy:** **45.68%** (outperforming baseline by $+3.7$ percentage points)
- **Macro Precision:** **0.3989**
- **Macro Recall:** **0.4129**
- **Macro F1-Score:** **0.3957** (more than double the baseline F1 of $0.1971$)
- **Multiclass Log Loss:** **1.0498**
- **Brier Score:** **0.6313**

### Q9: How do you interpret the 3×3 Confusion Matrix?
**Answer:**
The matrix displays actual classes along the vertical axis and predicted classes horizontally:
- **Home Wins ($H$):** 74 True Positives out of 136 actual home wins ($54.4\%$ recall, $50.0\%$ precision).
- **Away Wins ($A$):** 66 True Positives out of 112 actual away wins ($58.9\%$ recall, $46.8\%$ precision).
- **Draws ($D$):** 8 True Positives out of 76 actual draws ($10.5\%$ recall, $22.9\%$ precision).

### Q10: Why is Draw recall lower than Home and Away recall?
**Answer:**
Draws represent only $23\%$ of the dataset and arise from unstable game states (e.g. late equalizers, defensive stalemates, or penalties). Because football is an attacking-intent sport, models require higher evidentiary thresholds to forecast draws over home or away victories.

---

## 6. Domain Limitations & Epistemology

### Q11: What is the theoretical accuracy ceiling in football prediction?
**Answer:**
Unlike chess or board games, football features continuous state spaces, low event frequency (~2.9 goals per 90 minutes), and massive stochastic factors:
- In-game red cards (playing with 10 men shifts win probability by $>40\%$).
- Deflected shots, offside decisions, and VAR calls.
- In-game muscular injuries occurring after kickoff.

Because these random variables occur **after** kickoff, no pre-match model can foresee them. The Bayes optimal error rate in elite football outcome forecasting is typically bounded between **45% and 55% accuracy**. A model reporting 75%+ accuracy on football match outcomes is virtually guaranteed to suffer from data leakage.

---

## 7. UFC / MMA Subsystem & Symmetrized Inference

### Q12: How is the UFC prediction problem formulated compared to Premier League football?
**Answer:**
1. **Binary Classification with Decision Tree Ensembles:** Unlike football ($3$ classes: Home, Draw, Away), UFC outcomes are modeled as **binary classification** ($Y \in \{0, 1\}$: Fighter A Win vs Fighter B Win), with draws/no-contests (~1.8%) filtered out during training.
2. **Feature Representation:** Uses 33 pre-fight chronological differentials ($\Delta = \mathbf{x}_A - \mathbf{x}_B$), including reach differential, striking output rate (SLpM), takedown defense %, age difference, and rolling win streaks.
3. **Multi-Output Auxiliary Modeling:** A secondary multi-class classifier predicts the finish method distribution:
   $$P(\text{Method} \in \{\text{Decision}, \text{KO/TKO}, \text{Submission}\})$$

### Q13: What is the Corner-Swap Invariant, and why is it critical in combat sports?
**Answer:**
In competitive MMA, assigning a fighter to the Red or Blue corner is an arbitrary matchmaking convention (typically favoring reigning champions or higher-ranked athletes). 

For any objective machine learning predictor, swapping the input order or corners of two fighters must satisfy **mathematical symmetry**:
$$P(\text{Fighter } A \text{ beats } B) + P(\text{Fighter } B \text{ beats } A) = 1.0000$$
$$P_A(A \text{ vs } B) = P_A(B \text{ vs } A)$$

If swapping fighters changes Fighter A's win probability (e.g. from 73% in Red to 53% in Blue), the model is exhibiting **positional matchmaking bias** rather than assessing athletic skill.

### Q14: How does PITCHIQ mathematically eliminate Red-corner bias without discarding the trained model?
**Answer:**
We implemented **Dual-Pass Symmetric Inference** at the inference engine level:
1. **Pass 1:** Evaluate feature vector with Fighter A in Red, Fighter B in Blue $\to [P_{AB}(\text{Blue}), P_{AB}(\text{Red})]$.
2. **Pass 2:** Evaluate feature vector with Fighter B in Red, Fighter A in Blue $\to [P_{BA}(\text{Blue}), P_{BA}(\text{Red})]$.
3. **Symmetric Aggregation:**
   $$P(A) = \frac{P_{AB}(\text{Red}) + P_{BA}(\text{Blue})}{2}$$
   $$P(B) = \frac{P_{BA}(\text{Red}) + P_{AB}(\text{Blue})}{2}$$
   $$\sum = P(A) + P(B) \equiv 1.0000$$

This guarantees exact numerical invariance to corner assignment, yielding identical fair probabilities (e.g. Jon Jones = **65.4%**, Daniel Cormier = **34.6%**) regardless of input order.

### Q15: How was the Khabib Nurmagomedov vs Justin Gaethje (UFC 254) benchmark verified?
**Answer:**
At UFC 254 (2020-10-24), Khabib defeated Gaethje via submission. Two factors were verified:
1. **Zero-Leakage Pre-Fight Snapshot:** Passing `target_date="2020-10-24"` calculates pre-fight features strictly *prior* to UFC 254 (Khabib: 12-0 UFC streak, 168-day layoff; Gaethje: 4-fight streak, 413-day layoff).
2. **Prediction Outcome:** The symmetrized model predicts **Khabib Nurmagomedov** as the winner with **58.95%** win probability (vs Gaethje **41.05%**), strictly invariant whether Khabib is entered in Red or Blue.

### Q16: How does PITCHIQ prevent static profile leakage (career averages) in historical fight predictions?
**Answer:**
Standard web scraping yields career-aggregate statistics (e.g., total career SLpM as of 2024 or 2026). If career totals from 2026 are used to predict a bout in 2015, **static profile leakage** occurs.

PITCHIQ eliminates this by:
1. **Dynamic Cumulative Rate Computation:** Rebuilding striking, takedown, and defense rates dynamically from the chronological history of individual round-by-round bouts strictly occurring before `target_date`.
2. **Automated Leakage Test (`test_ufc_static_career_averages_isolated_from_historical_features`):** Artificially corrupting static profile averages with extreme values ($999.0$) and verifying that historical pre-fight feature vectors remain 100% bit-for-bit unchanged.

