using Atlas.SharedKernel.Domain;
using Atlas.SharedKernel.Results;
using Atlas.SharedKernel.Types;

namespace Atlas.Catalog.Domain;

public enum MuscleRole { Primary = 1, Secondary = 2, Stabilizer = 3 }
public enum Equipment { Barbell, Dumbbell, Machine, Cable, Bodyweight, Kettlebell, Band, Ball, None }
public enum Difficulty { Beginner, Intermediate, Advanced }

/// <summary>
/// Ativação muscular ponderada. O peso não é decoração: é o multiplicador do
/// cálculo de volume por grupo que alimenta o heatmap anatômico. Saber que o
/// exercício "é de peito" não basta — é preciso saber o quanto.
/// Ver spec 00 §4.2 e §8.3.
/// </summary>
public sealed record MuscleActivation(short MuscleGroupId, MuscleRole Role, decimal ActivationWeight)
{
    public static Result<MuscleActivation> Create(short muscleGroupId, MuscleRole role, decimal weight) =>
        weight is < 0 or > 1
            ? Error.Validation("activation.weight_out_of_range", "Peso de ativação deve estar entre 0 e 1.")
            : new MuscleActivation(muscleGroupId, role, weight);
}

public sealed record ExecutionCue(string Text);
public sealed record CommonMistake(string Text);

public sealed class Exercise : AggregateRoot<ExerciseId>
{
    private readonly List<MuscleActivation> _activations = [];
    private readonly List<ExecutionCue> _cues = [];
    private readonly List<CommonMistake> _mistakes = [];

    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public Equipment Equipment { get; private set; }
    public Difficulty Difficulty { get; private set; }
    public UserId? OwnerId { get; private set; }
    public bool IsCurated => OwnerId is null;

    public IReadOnlyList<MuscleActivation> Activations => _activations.AsReadOnly();
    public IReadOnlyList<ExecutionCue> ExecutionCues => _cues.AsReadOnly();
    public IReadOnlyList<CommonMistake> CommonMistakes => _mistakes.AsReadOnly();

    private Exercise() { }   // EF Core

    public static Result<Exercise> Create(
        string name,
        Equipment equipment,
        Difficulty difficulty,
        IReadOnlyCollection<MuscleActivation> activations,
        UserId? ownerId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Error.Validation("exercise.name_required", "Nome é obrigatório.");

        // Invariante do domínio, também validada na fronteira pelo schema Zod
        // do @atlas/contracts — nos dois lados, de propósito.
        if (!activations.Any(a => a.Role is MuscleRole.Primary))
            return Error.Validation("exercise.primary_required", "Exercício precisa de ao menos uma ativação primária.");

        var primarySum = activations.Where(a => a.Role is MuscleRole.Primary).Sum(a => a.ActivationWeight);
        if (primarySum > 1.0m)
            return Error.Validation("exercise.primary_weight_overflow", "Soma dos pesos primários não pode exceder 1.");

        var exercise = new Exercise
        {
            Id = ExerciseId.New(),
            Name = name.Trim(),
            Equipment = equipment,
            Difficulty = difficulty,
            OwnerId = ownerId
        };
        exercise._activations.AddRange(activations);
        exercise.Raise(new ExerciseCreated(exercise.Id, exercise.Name, exercise.IsCurated));
        return exercise;
    }

    public Result AddCue(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return Error.Validation("cue.empty", "Instrução de execução vazia.");
        _cues.Add(new ExecutionCue(text.Trim()));
        return Result.Success();
    }

    public Result AddCommonMistake(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return Error.Validation("mistake.empty", "Erro comum vazio.");
        _mistakes.Add(new CommonMistake(text.Trim()));
        return Result.Success();
    }

    /// <summary>
    /// Exercícios custom nunca entram no catálogo global sem revisão de admin —
    /// caso contrário a qualidade percebida do catálogo degrada rapidamente.
    /// </summary>
    public Result PromoteToCurated()
    {
        if (IsCurated) return Error.Conflict("exercise.already_curated", "Exercício já é curado.");
        OwnerId = null;
        Raise(new ExercisePromotedToCurated(Id));
        return Result.Success();
    }
}

public sealed record ExerciseCreated(ExerciseId ExerciseId, string Name, bool IsCurated) : DomainEvent;
public sealed record ExercisePromotedToCurated(ExerciseId ExerciseId) : DomainEvent;
