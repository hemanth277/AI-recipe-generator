// ===== DOM Elements =====
const form = document.getElementById('recipe-form');
const generateBtn = document.getElementById('generate-btn');
const btnContent = generateBtn.querySelector('.btn-content');
const btnLoading = generateBtn.querySelector('.btn-loading');
const recipeSection = document.getElementById('recipe-section');
const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');

// ===== Form Submission =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const ingredients = document.getElementById('ingredients-input').value.trim();
  const cuisine = document.getElementById('cuisine-select').value;
  const mealType = document.getElementById('meal-select').value;
  const dietaryPreferences = document.getElementById('diet-select').value;
  const servings = document.getElementById('servings-input').value;

  if (!ingredients) {
    showError('Please enter at least one ingredient.');
    return;
  }

  // Show loading
  setLoading(true);
  errorCard.style.display = 'none';
  recipeSection.style.display = 'none';

  try {
    const response = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, cuisine, mealType, dietaryPreferences, servings })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    if (data.success && data.recipe) {
      renderRecipe(data.recipe);
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (err) {
    showError(err.message || 'Failed to generate recipe. Please try again.');
  } finally {
    setLoading(false);
  }
});

// ===== Render Recipe =====
function renderRecipe(recipe) {
  // Name & Description
  document.getElementById('recipe-name').textContent = recipe.name || 'Your Recipe';
  document.getElementById('recipe-description').textContent = recipe.description || '';

  // Meta Badges
  const metaContainer = document.getElementById('recipe-meta');
  metaContainer.innerHTML = '';
  const metaItems = [
    { icon: '⏱️', label: recipe.prepTime, title: 'Prep' },
    { icon: '🔥', label: recipe.cookTime, title: 'Cook' },
    { icon: '⏰', label: recipe.totalTime, title: 'Total' },
    { icon: '👥', label: `${recipe.servings} servings`, title: 'Servings' },
    { icon: '📊', label: recipe.difficulty, title: 'Difficulty' },
    { icon: '🔋', label: recipe.calories ? `${recipe.calories} cal` : null, title: 'Calories' },
  ];
  metaItems.forEach(item => {
    if (item.label) {
      const badge = document.createElement('div');
      badge.className = 'meta-badge';
      badge.innerHTML = `<span class="meta-icon">${item.icon}</span> <span>${item.label}</span>`;
      badge.title = item.title;
      metaContainer.appendChild(badge);
    }
  });

  // Nutrition Strip
  const nutritionStrip = document.getElementById('nutrition-strip');
  nutritionStrip.innerHTML = '';
  if (recipe.nutritionFacts) {
    const facts = recipe.nutritionFacts;
    const nutritionItems = [
      { label: 'Protein', value: facts.protein },
      { label: 'Carbs', value: facts.carbs },
      { label: 'Fat', value: facts.fat },
      { label: 'Fiber', value: facts.fiber },
    ];
    nutritionItems.forEach(item => {
      if (item.value) {
        const div = document.createElement('div');
        div.className = 'nutrition-item';
        div.innerHTML = `
          <div class="nutrition-value">${item.value}</div>
          <div class="nutrition-label">${item.label}</div>
        `;
        nutritionStrip.appendChild(div);
      }
    });
    nutritionStrip.style.display = 'flex';
  } else {
    nutritionStrip.style.display = 'none';
  }

  // Ingredients
  const ingredientsList = document.getElementById('ingredients-list');
  ingredientsList.innerHTML = '';
  if (recipe.ingredients && recipe.ingredients.length) {
    recipe.ingredients.forEach((ing, i) => {
      const li = document.createElement('li');
      li.textContent = ing;
      li.style.animationDelay = `${i * 0.05}s`;
      ingredientsList.appendChild(li);
    });
  }

  // Instructions
  const instructionsList = document.getElementById('instructions-list');
  instructionsList.innerHTML = '';
  if (recipe.instructions && recipe.instructions.length) {
    recipe.instructions.forEach((step, i) => {
      const li = document.createElement('li');
      li.textContent = step;
      li.style.animationDelay = `${i * 0.08}s`;
      instructionsList.appendChild(li);
    });
  }

  // Tips
  const tipsSection = document.getElementById('tips-section');
  const tipsGrid = document.getElementById('tips-grid');
  tipsGrid.innerHTML = '';
  if (recipe.tips && recipe.tips.length) {
    recipe.tips.forEach(tip => {
      const div = document.createElement('div');
      div.className = 'tip-card';
      div.innerHTML = `<span class="tip-icon">💡</span>${tip}`;
      tipsGrid.appendChild(div);
    });
    tipsSection.style.display = 'block';
  } else {
    tipsSection.style.display = 'none';
  }

  // Show recipe section with animation
  recipeSection.style.display = 'block';
  recipeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Loading State =====
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  btnContent.style.display = isLoading ? 'none' : 'flex';
  btnLoading.style.display = isLoading ? 'flex' : 'none';
}

// ===== Error Display =====
function showError(message) {
  errorMessage.textContent = message;
  errorCard.style.display = 'block';
  errorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== Scroll to Top =====
function scrollToTop() {
  document.getElementById('ingredients-input').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Textarea Auto-resize =====
const textarea = document.getElementById('ingredients-input');
textarea.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});
